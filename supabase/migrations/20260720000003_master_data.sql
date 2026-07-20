-- S2: datos maestros — geografía, rigs, personas operativas, catálogos y
-- contratos (docs/03 §2, §3, §4, §6.3, §6.5, §6.6). Tickets S2-BE-01..04.
--
-- CRUD vía PostgREST directo: las políticas RLS son la capa de autorización.
-- Lectura: cualquier miembro del tenant. Escritura: TENANT_ADMIN o MANAGER.

-- ── Enums ──────────────────────────────────────────────────────────────────
create type site_status as enum ('ACTIVE', 'INACTIVE');
create type rig_type as enum ('DIAMOND_CORE', 'RC', 'PERCUSSION', 'TUNNELING', 'OTHER');
create type rig_status as enum ('OPERATIONAL', 'MAINTENANCE', 'INACTIVE', 'MOVING');
create type active_status as enum ('ACTIVE', 'INACTIVE');
create type shift_type as enum ('DAY', 'NIGHT', 'SWING', 'CUSTOM');
create type activity_category as enum ('DRILLING', 'MOVING', 'STANDBY', 'MAINTENANCE', 'SAFETY', 'OTHER');
create type consumable_category as enum ('DRILL_BIT', 'LUBRICANT', 'WATER', 'ADDITIVE', 'CEMENT', 'OTHER');
create type contract_status as enum ('DRAFT', 'ACTIVE', 'SUSPENDED', 'IN_BILLING', 'CLOSED');
create type billing_cycle as enum ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM');
create type rate_type as enum ('PER_METER', 'PER_HOUR', 'PER_DAY', 'PER_ACTIVITY', 'PER_DEPTH_TIER');
create type bonus_type as enum ('GOAL_ACHIEVED', 'SAFETY', 'EFFICIENCY', 'EARLY_COMPLETION');
create type penalty_type as enum ('STANDBY_EXCEED', 'INCIDENT', 'DELAY', 'QUALITY');
create type amount_type as enum ('FIXED', 'PERCENTAGE');
create type milestone_trigger as enum ('DEPTH_REACHED', 'HOLE_COMPLETED', 'DATE_REACHED');

-- ── Helper RLS: rol dentro de un conjunto ──────────────────────────────────
create function public.has_any_role(roles app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = any(roles)
  );
$$;

-- Escritores de datos maestros
create function public.can_manage_master_data()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_any_role(array['TENANT_ADMIN', 'MANAGER']::app_role[]);
$$;

-- ── Geografía ──────────────────────────────────────────────────────────────
create table public.regions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  name text not null,
  country char(2) not null default 'MX',
  timezone text not null default 'America/Mexico_City',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  -- Deviación de docs/03: nullable — el cliente puede no usar regiones al inicio
  region_id uuid references public.regions (id) on delete restrict,
  name text not null,
  code text not null,
  location geography(point, 4326),
  -- Lectura fácil de coordenadas (escribir siempre vía location, WKT)
  lat double precision generated always as (st_y(location::geometry)) stored,
  lng double precision generated always as (st_x(location::geometry)) stored,
  altitude_m int,
  timezone text,
  status site_status not null default 'ACTIVE',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table public.rigs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  site_id uuid references public.sites (id) on delete restrict,
  code text not null,
  brand text,
  model text,
  serial_number text,
  type rig_type not null default 'DIAMOND_CORE',
  owner_org uuid,
  status rig_status not null default 'OPERATIONAL',
  current_location geography(point, 4326),
  last_location_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

-- ── Personas operativas ────────────────────────────────────────────────────
create table public.drillers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  user_id uuid references public.users (id) on delete set null,
  full_name text not null,
  employee_code text,
  certifications jsonb not null default '[]',
  base_rate numeric(18,4),
  currency char(3) not null default 'MXN',
  status active_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  name text not null,
  rig_id uuid references public.rigs (id) on delete set null,
  lead_driller_id uuid references public.drillers (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crew_members (
  crew_id uuid not null references public.crews (id) on delete cascade,
  driller_id uuid not null references public.drillers (id) on delete cascade,
  role_in_crew text not null default 'driller',
  primary key (crew_id, driller_id)
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  rig_id uuid not null references public.rigs (id) on delete restrict,
  crew_id uuid references public.crews (id) on delete set null,
  shift_date date not null,
  shift_type shift_type not null default 'DAY',
  planned_start timestamptz,
  planned_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  supervisor_driller_id uuid references public.drillers (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Catálogos ──────────────────────────────────────────────────────────────
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  code text not null,
  label_es text not null,
  label_en text,
  category activity_category not null,
  billable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table public.consumables (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  code text not null,
  name text not null,
  category consumable_category not null,
  unit text not null default 'pcs',
  default_cost numeric(18,4),
  currency char(3) not null default 'MXN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

-- ── Contratos (S2-BE-04; UI llega en S3) ───────────────────────────────────
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  code text not null,
  name text not null,
  provider_org_id uuid,
  client_org_id uuid,
  currency char(3) not null default 'MXN',
  status contract_status not null default 'DRAFT',
  starts_at date,
  ends_at date,
  billing_cycle billing_cycle not null default 'MONTHLY',
  po_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table public.contract_rigs (
  contract_id uuid not null references public.contracts (id) on delete cascade,
  rig_id uuid not null references public.rigs (id) on delete restrict,
  primary key (contract_id, rig_id)
);

create table public.contract_sites (
  contract_id uuid not null references public.contracts (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete restrict,
  primary key (contract_id, site_id)
);

-- Historial completo: al editar tarifas se inserta un row nuevo, no se muta.
create table public.contract_rates (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  rate_type rate_type not null,
  activity_code text,
  depth_from_m int,
  depth_to_m int,
  amount numeric(18,4) not null,
  currency char(3) not null default 'MXN',
  valid_from date not null,
  valid_to date,
  created_by uuid references public.users (id),
  created_at timestamptz not null default now()
);

create table public.contract_bonuses (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  bonus_type bonus_type not null,
  condition jsonb not null default '{}',
  amount numeric(18,4) not null,
  amount_type amount_type not null default 'FIXED',
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now()
);

create table public.contract_penalties (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  penalty_type penalty_type not null,
  condition jsonb not null default '{}',
  amount numeric(18,4) not null,
  amount_type amount_type not null default 'FIXED',
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now()
);

create table public.contract_milestones (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  trigger milestone_trigger not null,
  trigger_value jsonb not null default '{}',
  amount numeric(18,4) not null,
  created_at timestamptz not null default now()
);

create table public.contract_consumables (
  contract_id uuid not null references public.contracts (id) on delete cascade,
  consumable_id uuid not null references public.consumables (id) on delete restrict,
  custom_cost numeric(18,4),
  primary key (contract_id, consumable_id)
);

-- ── Triggers updated_at ────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'regions','sites','rigs','drillers','crews','shifts',
    'activities','consumables','contracts'
  ] loop
    execute format(
      'create trigger %I_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ── Índices ────────────────────────────────────────────────────────────────
create index idx_sites_tenant on public.sites (tenant_id);
create index idx_sites_location on public.sites using gist (location);
create index idx_rigs_tenant on public.rigs (tenant_id);
create index idx_rigs_site on public.rigs (site_id);
create index idx_rigs_current_loc on public.rigs using gist (current_location);
create index idx_drillers_tenant on public.drillers (tenant_id);
create index idx_crews_tenant on public.crews (tenant_id);
create index idx_shifts_tenant_date on public.shifts (tenant_id, shift_date desc);
create index idx_shifts_rig_date on public.shifts (rig_id, shift_date desc);
create index idx_activities_tenant on public.activities (tenant_id);
create index idx_consumables_tenant on public.consumables (tenant_id);
create index idx_contracts_tenant on public.contracts (tenant_id);
create index idx_contract_rates_contract on public.contract_rates (contract_id);

-- ── RLS ────────────────────────────────────────────────────────────────────
-- Tablas con tenant_id: select para el tenant, escritura para admin/manager.
do $$
declare t text;
begin
  foreach t in array array[
    'regions','sites','rigs','drillers','crews','shifts',
    'activities','consumables','contracts'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy tenant_read on public.%I for select
         using (tenant_id = public.current_tenant_id())', t);
    execute format(
      'create policy admin_insert on public.%I for insert
         with check (tenant_id = public.current_tenant_id()
                     and public.can_manage_master_data())', t);
    execute format(
      'create policy admin_update on public.%I for update
         using (tenant_id = public.current_tenant_id()
                and public.can_manage_master_data())
         with check (tenant_id = public.current_tenant_id())', t);
    execute format(
      'create policy admin_delete on public.%I for delete
         using (tenant_id = public.current_tenant_id()
                and public.can_manage_master_data())', t);
  end loop;
end $$;

-- Tablas hijas sin tenant_id: autorizan a través del padre.
do $$
declare
  t text;
  parent text;
  fk text;
begin
  for t, parent, fk in
    select * from (values
      ('crew_members', 'crews', 'crew_id'),
      ('contract_rigs', 'contracts', 'contract_id'),
      ('contract_sites', 'contracts', 'contract_id'),
      ('contract_rates', 'contracts', 'contract_id'),
      ('contract_bonuses', 'contracts', 'contract_id'),
      ('contract_penalties', 'contracts', 'contract_id'),
      ('contract_milestones', 'contracts', 'contract_id'),
      ('contract_consumables', 'contracts', 'contract_id')
    ) as v(t, parent, fk)
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy tenant_read on public.%I for select
         using (exists (select 1 from public.%I p
                        where p.id = %I.%I
                          and p.tenant_id = public.current_tenant_id()))',
      t, parent, t, fk);
    execute format(
      'create policy admin_write on public.%I for all
         using (public.can_manage_master_data()
                and exists (select 1 from public.%I p
                            where p.id = %I.%I
                              and p.tenant_id = public.current_tenant_id()))
         with check (public.can_manage_master_data()
                and exists (select 1 from public.%I p
                            where p.id = %I.%I
                              and p.tenant_id = public.current_tenant_id()))',
      t, parent, t, fk, parent, t, fk);
  end loop;
end $$;
