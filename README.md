# Plataforma de Gestión de Perforación Minera

Software a la medida para operación de perforación multi-sitio: app móvil offline para captura en mina, dashboard web en tiempo real, motor de contratos con facturación/nómina automática, e IA operativa.

**Cliente:** minera en Zacatecas (resource owner) · **Desarrolla:** Sentido
**Referencia competitiva:** [Krux Analytics](https://www.kruxanalytics.com/) (KruxLog + KruxMetrix)
**Propuesta comercial:** https://propuestas.sentido.mx/perforaciones-zacatecas

## Documentación

| Doc | Contenido |
|---|---|
| [docs/01-analisis-referencia-krux.md](docs/01-analisis-referencia-krux.md) | Análisis del software de referencia, gaps y diferenciadores |
| [docs/02-spec-funcional.md](docs/02-spec-funcional.md) | Spec funcional MVP: 21 módulos, flujos, reglas de negocio, criterios go-live |
| [docs/03-modelo-datos.md](docs/03-modelo-datos.md) | Schema Postgres: 50+ tablas, RLS multi-tenant, PostGIS, índices |
| [docs/04-pantallas.md](docs/04-pantallas.md) | Inventario de 44 vistas (16 app móvil + 28 dashboard web) |
| [docs/05-backlog.md](docs/05-backlog.md) | 150+ tickets en 12 sprints (16 sem Fase 01 + 8 sem Fase 02) |

## Stack (planeado)

- **App móvil:** React Native (Expo) + SQLite offline-first
- **Dashboard web:** Next.js + Tailwind + shadcn/ui, deploy en Vercel
- **Backend/BD:** Supabase (Postgres + RLS + Auth + Storage) *(confirmado en setup — sustituye al plan original de Digital Ocean)*
- **IA (Fase 02):** Claude API con function calling
- **Repos/CI:** GitHub + GitHub Actions

## Estado

- [x] Análisis de referencia (Krux)
- [x] Spec funcional + modelo de datos + pantallas + backlog
- [x] Bootstrap monorepo: apps/web (Next.js) + apps/mobile (Expo) + packages/shared + CI + migración inicial Supabase
- [x] Repo GitHub (`jos-sentido/meneria-mvp`) + Vercel conectado (auto-deploy desde `apps/web`)
- [ ] Proyecto Supabase cloud + aplicar migraciones (`supabase login` → `link` → `db push`)
- [ ] Discovery con cliente (10 preguntas abiertas en docs/01 §9)
- [ ] Sprint S0 (semana 0 del backlog)

## Setup local

```bash
corepack pnpm install     # o pnpm install (requiere pnpm ≥ 10)
pnpm dev:web              # Next.js en localhost:3000
pnpm dev:mobile           # Expo dev server
npx supabase start        # stack local (requiere Docker) + aplica migraciones
```

Variables de entorno: copiar `apps/web/.env.example` → `.env.local` y `apps/mobile/.env.example` → `.env`.
