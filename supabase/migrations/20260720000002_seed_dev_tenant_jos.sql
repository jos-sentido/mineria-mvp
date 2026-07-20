-- Seed de fase de desarrollo: tenant demo + perfil/rol para Jos.
-- ⚠️ Antes del go-live con datos reales del cliente: sustituir este tenant
-- demo por el tenant real (o limpiarlo). Idempotente a propósito.

insert into public.tenants (id, name, type)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Minera Demo Zacatecas',
  'RESOURCE_OWNER'
)
on conflict (id) do nothing;

-- Perfil 1:1 para el usuario auth existente (creado a mano en el dashboard).
insert into public.users (id, tenant_id, email, full_name, status)
select
  au.id,
  'a0000000-0000-4000-8000-000000000001',
  au.email,
  'Jos Alvarez',
  'ACTIVE'
from auth.users au
where au.email = 'jos@sentido.mx'
on conflict (id) do nothing;

insert into public.user_roles (user_id, role)
select au.id, 'TENANT_ADMIN'::app_role
from auth.users au
where au.email = 'jos@sentido.mx'
on conflict do nothing;
