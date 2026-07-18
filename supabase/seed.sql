-- Seed de desarrollo local (supabase db reset lo aplica después de migrar).
-- Solo datos de prueba — nunca datos reales del cliente.

insert into public.tenants (id, name, type)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Minera Demo Zacatecas',
  'RESOURCE_OWNER'
)
on conflict (id) do nothing;
