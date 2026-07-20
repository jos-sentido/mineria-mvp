# CLAUDE.md — Proyecto mineria-mvp

## Qué es esto

Plataforma de gestión de perforación minera para cliente de Sentido (minera dueña en Zacatecas). Compite contra Krux Analytics. Lee `README.md` y los 5 docs en `docs/` antes de tocar código — ahí está TODO el contexto (spec, schema, pantallas, backlog).

## Decisiones ya tomadas (no re-litigar)

1. **Alcance MVP ampliado**: el cliente pidió incluir TODOS los gaps vs Krux (Scheduler, Hole Task Manager, Core Recovery, PO numbers, Survey, Timesheet). Ver docs/02 §3.1 — son 21 módulos MVP.
2. **Multi-rol desde día 1**: el sistema debe servir a resource owners, service providers e integradas. El cliente actual es resource owner. Schema multi-tenant con RLS.
3. **Monorepo**: apps/api + apps/web + apps/mobile.
4. **Stack**: Expo (mobile), Next.js + shadcn (web), Supabase (Postgres + Auth + Storage + RLS), Vercel (web deploy), GitHub.
   - Nota: docs/02 y 03 mencionan Digital Ocean porque era el plan de la propuesta original; Jos decidió después usar Supabase. Al hacer setup, actualizar los docs.
5. **Dinero**: `numeric(18,4)`, nunca float. IDs: uuid v4 client-generable (sync offline).
6. **Idiomas**: ES default + EN. Monedas: MXN default, por-contrato configurable.

## Estado del setup infra (actualizado 2026-07-20)

Hecho en local:
- Monorepo pnpm workspaces: apps/web (Next.js 16 + Tailwind), apps/mobile (Expo SDK 57), packages/shared. `.npmrc` con `node-linker=hoisted` (obligatorio para Expo+pnpm — no quitar).
- `supabase init` + migración inicial `supabase/migrations/20260717000001_tenants_users_audit.sql` (tenants, users 1:1 con auth.users, user_roles, audit_log, RLS con `auth.uid()` — NO el patrón `app.current_tenant` de docs/03 §12, que era para API propia).
- CI GitHub Actions (lint + typecheck + build web).
- Docs actualizados: referencias Digital Ocean → Supabase.

Hecho en cloud:
- Repo GitHub: `jos-sentido/mineria-mvp` (privado). Push de main hecho.
- Vercel: proyecto `mineria-mvp` (team sentido) vinculado al repo, Root Directory `apps/web`, framework Next.js, auto-deploy funcionando.
- Supabase: proyecto `mniwqxkznqpxvbxkfmds` con integración GitHub (aplica `supabase/migrations/` en cada push a main — migración inicial ya aplicada y verificada) e integración Vercel (env vars inyectadas en Production). `.env.local` de web y `.env` de mobile ya tienen URL + anon key.

Sprint S1 (hecho):
- Web: theme con tokens de la propuesta (ocre #C28B47 + cyan #4FB6C9, dark default), shadcn/ui (ojo: usa Base UI, patrón `render={}` no `asChild`), i18n next-intl por cookie sin prefijo de ruta (ES default), auth Supabase SSR completo (middleware protege todo excepto /login), shell dashboard (sidebar + header + user menu + switcher idioma), login react-hook-form + zod. Verificado en browser contra Supabase cloud.
- Mobile: i18n ES/EN (i18n-js + expo-localization), supabase client con sesión en expo-secure-store, login + guard con Stack.Protected de expo-router, SQLite (expo-sqlite + drizzle-orm) con tablas dsr_drafts y sync_queue (bootstrap SQL idempotente; migrar a drizzle-kit en S4). Template demo de Expo eliminado.
- CI ahora corre typecheck de los 3 paquetes.

Sprint S2 (en curso):
- Migración `20260720000003_master_data.sql`: regions, sites (PostGIS + columnas generadas lat/lng — escribir siempre vía `location` con WKT `SRID=4326;POINT(lng lat)`), rigs, drillers, crews, crew_members, shifts, activities, consumables, contracts + 6 tablas hijas. RLS: lectura por tenant, escritura TENANT_ADMIN/MANAGER (`can_manage_master_data()`); tablas hijas autorizan vía el padre.
- Web /catalogs con 5 CRUDs: sitios, rigs, perforistas, actividades, consumibles (server components + server actions + dialogs, i18n completo). Nav "Catálogos" habilitado.
- Ojo Base UI Select: pasar `items` al Root o el trigger muestra el valor crudo en vez del label (resuelto en components/crud/form-select.tsx).
- Usuario jos@sentido.mx ya con perfil ACTIVE + rol TENANT_ADMIN en tenant demo (migración 20260720000002) — puede escribir en catálogos.
- Segunda entrega S2: UI cuadrillas con asignación de integrantes (reemplazo completo de crew_members al guardar), import CSV de consumibles (parser propio client-side + upsert onConflict tenant_id,code, máx 1000 filas), UI regiones + select de región en sitios. Los 7 tabs de catálogos completos.
- S2 cerrado salvo pantalla B.24 (datos maestros hub) que se cubrirá con el admin del tenant en S3.

Pendiente:
1. S1-MOB-05: pipeline EAS build (requiere `npx eas login` — cuenta Expo de Jos).
2. Validar migración local con Docker: `npx supabase start` (requiere Docker corriendo).
3. `SUPABASE_SERVICE_ROLE_KEY` en Preview cuando se necesite (write-only en Vercel, copiar del dashboard Supabase).
4. Seguir backlog: resto de S2, luego S3.

## Contexto comercial (no técnico)

- Propuesta comercial: `~/Sentido-repo/propuestas/perforaciones-zacatecas/index.html` (publicada en propuestas.sentido.mx/perforaciones-zacatecas).
- ⚠️ La propuesta cotiza $110k MXN Fase 01 + $40k Fase 02, pero el alcance ampliado sube el esfuerzo ~30-40%. Jos debe recalibrar precio o mover módulos a Fase 02 antes de firmar.
- ⚠️ La propuesta publicada aún tiene pendientes: banner placeholder visible en hero, falta form de lead, falta logo en hero, fecha desactualizada (Abr 2026), palabra vetada "Capacidad" en sección 05.
- Discovery pendiente con el cliente: 10 preguntas en docs/01 §9 (qué software usan hoy, tipo de perforación, survey sí/no, ERP, volumen de rigs, etc.).

## Convenciones al desarrollar

- Sprints de 2 semanas, trunk-based, feature flags, CI verde antes de merge.
- Coverage mínimo 60% MVP con foco en dominio (motor de contratos, reconciliación).
- Definition of Done: código + tests + preview deploy + docs actualizadas.
