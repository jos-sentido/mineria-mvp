-- Migración inicial: módulo TENANT / usuarios (docs/03 §1) — ticket S1-BE-02
--
-- Adaptación a Supabase respecto a docs/03:
--   * Credenciales viven en auth.users (Supabase Auth). public.users es el
--     perfil operativo 1:1 (sin password_hash; bcrypt lo maneja GoTrue).
--   * RLS usa auth.uid() + helper current_tenant_id() en lugar de
--     current_setting('app.current_tenant') — no hay middleware propio que
--     inyecte settings; PostgREST autentica por JWT.

-- ── Extensiones ────────────────────────────────────────────────────────────
create extension if not exists citext;
create extension if not exists postgis;

-- ── Enums ──────────────────────────────────────────────────────────────────
create type tenant_type as enum ('RESOURCE_OWNER', 'SERVICE_PROVIDER', 'INTEGRATED');
create type plan_type as enum ('MVP', 'PRO', 'ENTERPRISE');
create type tenant_status as enum ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
create type user_status as enum ('ACTIVE', 'INVITED', 'DISABLED');
create type app_role as enum (
  'DRILLER',
  'SUPERVISOR',
  'SITE_COORDINATOR',
  'MANAGER',
  'ACCOUNTING',
  'EXTERNAL_STAKEHOLDER',
  'TENANT_ADMIN'
);
create type role_scope as enum ('GLOBAL', 'SITE', 'RIG', 'CONTRACT');

-- ── Helper: updated_at automático ──────────────────────────────────────────
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── tenants ────────────────────────────────────────────────────────────────
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type tenant_type not null,
  default_currency char(3) not null default 'MXN',
  default_language char(2) not null default 'ES',
  default_timezone text not null default 'America/Mexico_City',
  plan plan_type not null default 'MVP',
  status tenant_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tenants_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

-- ── users (perfil operativo, 1:1 con auth.users) ───────────────────────────
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  email citext not null,
  full_name text not null,
  language char(2),
  phone text,
  avatar_url text,
  status user_status not null default 'INVITED',
  last_login_at timestamptz,
  mfa_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, email)
);

create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create index idx_users_tenant on public.users (tenant_id);

-- ── user_roles ─────────────────────────────────────────────────────────────
-- scope_id usa uuid cero como sentinela para GLOBAL (una PK no admite nulls).
create table public.user_roles (
  user_id uuid not null references public.users (id) on delete cascade,
  role app_role not null,
  scope_type role_scope not null default 'GLOBAL',
  scope_id uuid not null default '00000000-0000-0000-0000-000000000000',
  created_at timestamptz not null default now(),
  primary key (user_id, role, scope_type, scope_id),
  check ((scope_type = 'GLOBAL') = (scope_id = '00000000-0000-0000-0000-000000000000'))
);

-- ── audit_log (append-only) ────────────────────────────────────────────────
create table public.audit_log (
  id bigint generated always as identity primary key,
  tenant_id uuid not null,
  actor_user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_audit_created on public.audit_log using brin (created_at);
create index idx_audit_entity on public.audit_log (tenant_id, entity_type, entity_id);

revoke update, delete on public.audit_log from authenticated, anon;

-- ── Helpers RLS ────────────────────────────────────────────────────────────
-- security definer para no recursar sobre el RLS de public.users.
create function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.users where id = auth.uid();
$$;

create function public.has_role(required_role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = required_role
  );
$$;

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.tenants enable row level security;
alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_log enable row level security;

-- Cada quien ve solo su tenant. Escrituras administrativas: service_role
-- (bypassa RLS) hasta que existan endpoints con guards por rol (S3-BE-04).
create policy tenant_isolation on public.tenants
  for select using (id = public.current_tenant_id());

create policy users_same_tenant on public.users
  for select using (tenant_id = public.current_tenant_id());

create policy users_update_own_profile on public.users
  for update using (id = auth.uid())
  with check (id = auth.uid() and tenant_id = public.current_tenant_id());

create policy user_roles_own on public.user_roles
  for select using (
    user_id = auth.uid()
    or (public.has_role('TENANT_ADMIN')
        and user_id in (select id from public.users where tenant_id = public.current_tenant_id()))
  );

create policy audit_select_admin on public.audit_log
  for select using (
    tenant_id = public.current_tenant_id() and public.has_role('TENANT_ADMIN')
  );
