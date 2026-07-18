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

## Estado del setup infra (actualizado 2026-07-17)

Hecho en local:
- Monorepo pnpm workspaces: apps/web (Next.js 16 + Tailwind), apps/mobile (Expo SDK 57), packages/shared. `.npmrc` con `node-linker=hoisted` (obligatorio para Expo+pnpm — no quitar).
- `supabase init` + migración inicial `supabase/migrations/20260717000001_tenants_users_audit.sql` (tenants, users 1:1 con auth.users, user_roles, audit_log, RLS con `auth.uid()` — NO el patrón `app.current_tenant` de docs/03 §12, que era para API propia).
- CI GitHub Actions (lint + typecheck + build web).
- Docs actualizados: referencias Digital Ocean → Supabase.

Hecho en cloud:
- Repo GitHub: `jos-sentido/mineria-mvp` (privado). Push de main hecho.
- Vercel: proyecto `mineria-mvp` (team sentido) vinculado al repo, Root Directory `apps/web`, framework Next.js, auto-deploy funcionando.

Pendiente (requiere acción manual de Jos):
1. `npx supabase login` + crear proyecto + `npx supabase link` + `npx supabase db push`.
2. Validar migración local con Docker: `npx supabase start` (no había Docker corriendo en el setup).
3. Cargar env vars de Supabase en Vercel y en `.env.local` cuando exista el proyecto.
4. Seguir backlog: docs/05 sprint S0-S1.

## Contexto comercial (no técnico)

- Propuesta comercial: `~/Sentido-repo/propuestas/perforaciones-zacatecas/index.html` (publicada en propuestas.sentido.mx/perforaciones-zacatecas).
- ⚠️ La propuesta cotiza $110k MXN Fase 01 + $40k Fase 02, pero el alcance ampliado sube el esfuerzo ~30-40%. Jos debe recalibrar precio o mover módulos a Fase 02 antes de firmar.
- ⚠️ La propuesta publicada aún tiene pendientes: banner placeholder visible en hero, falta form de lead, falta logo en hero, fecha desactualizada (Abr 2026), palabra vetada "Capacidad" en sección 05.
- Discovery pendiente con el cliente: 10 preguntas en docs/01 §9 (qué software usan hoy, tipo de perforación, survey sí/no, ERP, volumen de rigs, etc.).

## Convenciones al desarrollar

- Sprints de 2 semanas, trunk-based, feature flags, CI verde antes de merge.
- Coverage mínimo 60% MVP con foco en dominio (motor de contratos, reconciliación).
- Definition of Done: código + tests + preview deploy + docs actualizadas.
