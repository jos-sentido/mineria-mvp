# Backlog MVP — Perforación Zacatecas

**Cronograma:** 16 semanas para Fase 01 + 8 semanas para Fase 02.
**Team asumido:** 1 tech lead (Jos) + 1 full-stack senior + 1 mobile developer + 1 diseñador part-time.
**Sizing:** S = ½ día, M = 1-2 días, L = 3-5 días, XL = >5 días (dividir).
**Formato ticket:** `[SPRINT] [CÓDIGO] Título — tamaño — deps`

Sprints de 2 semanas → 8 sprints Fase 01, 4 sprints Fase 02.

---

## S0 — Semana 0 · Discovery + arranque (blocker)

| Código | Título | Size |
|---|---|---|
| S0-01 | Kickoff con cliente: recoger exports del sistema actual, videos de uso | M |
| S0-02 | Sesiones con dirección, coordinación, supervisión y perforista muestra | L |
| S0-03 | Documento de datos maestros del cliente (rigs, sitios, contratos activos) | M |
| S0-04 | Firmar NDA y contrato Fase 01 con anticipo 30% | S |
| S0-05 | Crear cuentas Supabase, Vercel, GitHub (arranque en cuenta Sentido; transferir a la minera antes de go-live) | M |
| S0-06 | Provisionar Postgres managed + Spaces bucket + dominios | S |
| S0-07 | Repo monorepo con estructura apps/api apps/web apps/mobile + CI base | M |
| S0-08 | Setup de herramientas: Sentry, PostHog / Plausible, Statuspage | M |
| S0-09 | Base de Figma con design tokens de la propuesta (colores ocre + cyan) | M |

---

## S1 — Semanas 1-2 · Fundaciones

**Meta sprint:** infraestructura + auth + esqueletos de app/web deployables.

### Backend / infra
- S1-BE-01 · Bootstrap API: NestJS o Fastify con TS, estructura módulos — L
- S1-BE-02 · Postgres schema base: tenants, users, roles, audit_log, migrations con Drizzle o Prisma — L
- S1-BE-03 · RLS multi-tenant + middleware inyecta `app.current_tenant` — M
- S1-BE-04 · Auth JWT + refresh + password bcrypt — M
- S1-BE-05 · OpenAPI docs auto-generado + swagger UI — S
- S1-BE-06 · Health checks, structured logging (pino), request id — M
- S1-BE-07 · Deploy pipeline: migraciones Supabase vía CI (supabase db push) + CI GitHub Actions — L

### Web
- S1-WEB-01 · Bootstrap Next.js 15 + Tailwind + shadcn/ui — M
- S1-WEB-02 · Sistema de tema con tokens de la propuesta — M
- S1-WEB-03 · Layout base con sidebar + header + i18n (next-intl ES/EN) — L
- S1-WEB-04 · Login page + form + validación (react-hook-form + zod) — M
- S1-WEB-05 · Auth flow completo (login, refresh, logout, guard rutas) — M
- S1-WEB-06 · Deploy Vercel + preview branches — S

### Mobile
- S1-MOB-01 · Bootstrap Expo (SDK 52+) con TS + expo-router — M
- S1-MOB-02 · Configurar i18n ES/EN + tema — M
- S1-MOB-03 · Login screen + auth flow con secure storage — M
- S1-MOB-04 · Setup SQLite (expo-sqlite) + drizzle-orm local — M
- S1-MOB-05 · Setup pipeline EAS build para iOS + Android — L

---

## S2 — Semanas 3-4 · Datos maestros y personas

**Meta sprint:** admin del tenant puede crear sitios, rigs, perforistas, contratos básicos.

### Backend
- S2-BE-01 · Migraciones: regions, sites, rigs (con PostGIS) — L
- S2-BE-02 · Migraciones: drillers, crews, crew_members, shifts — M
- S2-BE-03 · Migraciones: activities, consumables, contract_consumables — M
- S2-BE-04 · Migraciones: contracts, contract_rates, contract_bonuses, contract_penalties, contract_milestones, contract_rigs, contract_sites — XL (dividir en 2 subtickets)
- S2-BE-05 · Endpoints CRUD sitios y rigs con auth/roles — M
- S2-BE-06 · Endpoints CRUD drillers y crews — M
- S2-BE-07 · Endpoints CRUD activities y consumables + bulk import CSV — L
- S2-BE-08 · Endpoints contratos con tarifas (versión simple, sin bonos complejos aún) — L

### Web
- S2-WEB-01 · Pantalla B.4 Sitios (lista + editor + mapa detalle) — L
- S2-WEB-02 · Pantalla B.5 Rigs (lista + editor + histórico) — L
- S2-WEB-03 · Pantalla B.15 Perforistas y cuadrillas — L
- S2-WEB-04 · Pantalla B.14 Actividades catálogo — M
- S2-WEB-05 · Pantalla B.13 Consumibles catálogo + import CSV — L
- S2-WEB-06 · Pantalla B.24 Datos maestros — M

---

## S3 — Semanas 5-6 · Contratos avanzados + roles

**Meta sprint:** motor de contratos completo con condition builder.

### Backend
- S3-BE-01 · Endpoints bonos + penalties + milestones — L
- S3-BE-02 · Motor de evaluación de condition JSON (`{metric, op, value}`) con test suite — L
- S3-BE-03 · Endpoint preview: "simular DSR contra contrato" para preview UI — M
- S3-BE-04 · Roles y permisos: `user_roles` con scope, guards en API — L
- S3-BE-05 · Endpoints admin usuarios + invitación email — M

### Web
- S3-WEB-01 · Pantalla B.8 Editor de contrato completo con tabs — XL (dividir)
- S3-WEB-02 · Pantalla B.9 Condition builder visual — L
- S3-WEB-03 · Pantalla B.22 Admin usuarios y roles — L
- S3-WEB-04 · Pantalla B.21 Admin tenant — M

---

## S4 — Semanas 7-8 · **Captura DSR offline (crítico)**

**Meta sprint:** app móvil captura DSR completo offline con doble aprobación.
**Este sprint es el corazón del MVP.**

### Mobile
- S4-MOB-01 · Pantallas A.1 Login + A.2 Home selector turno — M
- S4-MOB-02 · Pantalla A.3 Captura DSR header — M
- S4-MOB-03 · Pantalla A.4 Captura DSR actividades (timeline + modal add) — L
- S4-MOB-04 · Pantalla A.5 Captura DSR consumibles (filtro contrato) — L
- S4-MOB-05 · Pantalla A.6 Captura DSR paros — L
- S4-MOB-06 · Pantalla A.7 Captura DSR core recovery — M
- S4-MOB-07 · Pantalla A.8 Captura DSR incidentes con fotos — M
- S4-MOB-08 · Pantalla A.9 Captura DSR timesheet — M
- S4-MOB-09 · Pantalla A.10 Revisión + firma digital + envío — L
- S4-MOB-10 · Validaciones live: profundidad, sumas, rangos — L
- S4-MOB-11 · Store local SQLite: entities + queue de sync — L

### Backend
- S4-BE-01 · Migraciones DSR + dsr_activities + dsr_consumables + dsr_downtimes + dsr_timesheet + dsr_core_recovery + dsr_incidents + dsr_approvals — XL (dividir)
- S4-BE-02 · Endpoint POST /dsrs (idempotente con UUID cliente) — M
- S4-BE-03 · Endpoint sync bulk (batch push) — L
- S4-BE-04 · Endpoint sync pull (`GET /sync?since=`) — M
- S4-BE-05 · Guard DRILLER: solo ve su propio DSR + shift asignado — M

---

## S5 — Semanas 9-10 · Sync, aprobación, conflictos

**Meta sprint:** flujo perforista → supervisor → oficina completo.

### Mobile
- S5-MOB-01 · Cola de sync con retry backoff + indicador visual — L
- S5-MOB-02 · Pantalla A.11 Bandeja supervisor — M
- S5-MOB-03 · Pantalla A.12 Detalle DSR supervisor con aprobar/rechazar — L
- S5-MOB-04 · Pantalla A.14 Bandeja sync + conflictos UI — L
- S5-MOB-05 · Push notifications: DSR pendiente de aprobar — M
- S5-MOB-06 · Pantalla A.15 Perfil + config — S
- S5-MOB-07 · Pantalla A.13 Tareas del pozo — M

### Backend
- S5-BE-01 · State machine DSR (borrador → revisión → aprobado → final) con audit — L
- S5-BE-02 · Endpoints aprobar/rechazar/finalizar/anular — M
- S5-BE-03 · Sistema notificaciones + push FCM/APNs — L
- S5-BE-04 · Job cron: auto-finalizar DSR aprobado > 24h — S
- S5-BE-05 · Resolución conflictos server-side (last-write-wins + audit) — M

---

## S6 — Semanas 11-12 · Dashboard, KPIs, mapa live

**Meta sprint:** oficina ve la operación en vivo.

### Backend
- S6-BE-01 · Agregados KPI (metros día/semana/mes, standby%, DSR pendientes) — L
- S6-BE-02 · Endpoint stream WebSocket o SSE para live updates — L
- S6-BE-03 · Endpoint listar DSRs filtrable + paginado — M
- S6-BE-04 · Endpoint detalle DSR completo con líneas — M

### Web
- S6-WEB-01 · Pantalla B.2 Home ejecutivo con KPI tiles y live — L
- S6-WEB-02 · Pantalla B.3 Mapa geográfico (integrar Mapbox) — L
- S6-WEB-03 · Pantalla B.6 Bandeja DSRs con filtros — L
- S6-WEB-04 · Pantalla B.7 Detalle DSR completo con tabs y audit — L
- S6-WEB-05 · Componente TimelineDSR (estado con audit trail) — M

---

## S7 — Semanas 13-14 · Pozos, programa, task manager

**Meta sprint:** planificación + tracking de pozos y tareas.

### Backend
- S7-BE-01 · Migraciones programs, holes, hole_survey_points, hole_tasks, hole_task_templates — L
- S7-BE-02 · Endpoints CRUD programas y pozos — L
- S7-BE-03 · Endpoints import CSV plan de perforación — M
- S7-BE-04 · Endpoints hole_tasks + upload evidencia S3 — L
- S7-BE-05 · State machine hole con validación tasks — M

### Web
- S7-WEB-01 · Pantalla B.10 Programa: Gantt + calendario + mapa — XL
- S7-WEB-02 · Pantalla B.11 Pozos: lista y detalle con survey — L
- S7-WEB-03 · Pantalla B.12 Task manager global kanban — L

---

## S8 — Semanas 15-16 · **Facturación + nómina + reportes + go-live**

**Meta sprint:** cerrar el loop económico y salir en producción.

### Backend
- S8-BE-01 · Migraciones billing_periods, invoices, invoice_lines, payroll_runs, payroll_lines, additional_charges, rentals — L
- S8-BE-02 · Job cierre periodo: genera invoice_lines desde DSRs aprobados aplicando contrato — XL
- S8-BE-03 · Cálculo nómina desde DSR + timesheet + bonos por driller — L
- S8-BE-04 · Motor de reportes PDF (Puppeteer + templates HTML) — L
- S8-BE-05 · Motor de reportes XLSX (exceljs) — M
- S8-BE-06 · Endpoint export CSV genérico con `?since=` — M
- S8-BE-07 · Templates iniciales: operativo, financiero, contrato (3 PDF + 3 XLSX) — L

### Web
- S8-WEB-01 · Pantalla B.16 Facturación (periodos + facturas + preview + editor) — XL
- S8-WEB-02 · Pantalla B.17 Nómina (corridas + export bancario) — L
- S8-WEB-03 · Pantalla B.18 Reportes biblioteca + generador — L
- S8-WEB-04 · Pantalla B.19 Alertas — M
- S8-WEB-05 · Pantalla B.25 Auditoría — M
- S8-WEB-06 · Pantalla B.26 Vista stakeholder externo — L
- S8-WEB-07 · Pantalla B.27 Sistema estado + logs — S
- S8-WEB-08 · Vistas de error B.28 — S

### QA + Go-live
- S8-QA-01 · Test end-to-end del flujo A (captura → aprobación → dashboard) — L
- S8-QA-02 · Test end-to-end del flujo B (contrato → DSR → factura → nómina) — L
- S8-QA-03 · Prueba de carga: 10k DSRs simulados, medir p95 — M
- S8-QA-04 · Prueba offline: 8h captura sin señal + sync — M
- S8-QA-05 · Piloto en mina 1 semana con capitanes + soporte in-situ — XL
- S8-QA-06 · Capacitación oficina (grabada) — M
- S8-QA-07 · Capacitación perforistas en mina (grabada + material impreso) — M
- S8-QA-08 · Documentación: README, arquitectura, API, runbook, guía usuario final — L
- S8-QA-09 · Go-live supervisado + hypercare 1 semana — L

---

## FASE 02 (Semanas 17-24)

### S9 — Semanas 17-18 · Import histórico + refinamiento

- S9-01 · Scripts import histórico desde exports del cliente (holes → DSRs → invoices) — XL
- S9-02 · Validación cruzada facturación histórica ± 0.1% — L
- S9-03 · Backlog de refinamientos UX priorizado con feedback real (semana de prod) — L
- S9-04 · Optimización queries lentas identificadas en prod — L
- S9-05 · Optimización bundle mobile + web — M

### S10 — Semanas 19-20 · IA operativa

- S10-01 · Migraciones ai_conversations, ai_messages, ai_alerts — S
- S10-02 · Integración Claude API con function calling — L
- S10-03 · Herramientas del bot: query DSRs, query KPI, query contrato, listar alertas — L
- S10-04 · Pantalla B.20 Chat panel lateral en web — L
- S10-05 · Pantalla A.16 Chat en app móvil — M
- S10-06 · Sistema de citations (bot debe citar la fila que consultó) — L
- S10-07 · Guard rails: NUNCA inventar números, siempre citar o decir no sé — L
- S10-08 · Latencia p50 < 4s medida — M

### S11 — Semanas 21-22 · Alertas proactivas + análisis paros

- S11-01 · Job cron: detección de desviaciones de contrato → ai_alerts — L
- S11-02 · Job cron: detección de standby anómalo → ai_alerts — L
- S11-03 · Clasificación IA de paros (categoría probable + patrón) — L
- S11-04 · Notificación email/push de alertas críticas — M
- S11-05 · UI ack + resolución de alertas — M
- S11-06 · Reportes ESG básicos (huella carbono, safety, gobernanza) — L

### S12 — Semanas 23-24 · Integraciones + multi-tenant lista

- S12-01 · Refactor definitivo multi-tenant (multi-organización compartida) — L
- S12-02 · Integración modelo geológico (Leapfrog / Micromine — export por hole) — L
- S12-03 · Integración ERP (conector genérico + adaptador SAP o Bind) — XL
- S12-04 · Webhooks salientes configurables — M
- S12-05 · API keys management + rate limiting por key — M
- S12-06 · Optimización de performance final — L
- S12-07 · Handoff completo (docs, contraseñas, capacitación admin cliente) — M
- S12-08 · Retrospectiva + baseline de KPIs para medir impacto — S

---

## FASE 03 (roadmap IoT — cuando se valide hardware)

- F3-01 · Discovery de sensores compatibles con maquinaria del cliente
- F3-02 · Proof of concept con 1 rig instrumentado
- F3-03 · Capa de ingestión MQTT / OPC-UA
- F3-04 · Modelo predictivo de mantenimiento
- F3-05 · Reducción progresiva de captura manual redundante
- F3-06 · Métricas de huella carbono desde sensor

---

## Convenciones de trabajo sugeridas

- **Sprints de 2 semanas** con demo interna al final.
- **Trunk-based** con feature flags para riesgos.
- **CI verde antes de merge**: lint + tests + build.
- **Coverage mínimo:** 60% MVP, 75% F2, foco en dominio (motor de contratos, reconciliación).
- **Definition of Done por ticket:**
  - Código con tests.
  - Deployado a preview.
  - Design review si aplica UI.
  - Doc actualizada.
  - Manual QA smoke.

---

## Riesgos de scope (a monitorear)

- **S4 (captura DSR)** — si se atrasa, corre el resto. Buffer sugerido +3 días.
- **S8 (facturación)** — el motor de reconciliación es donde suelen aparecer casos edge. Buffer +5 días.
- **Contratos custom del cliente** — si su condition builder no cubre 1 regla exótica, escalar a DSL o hardcode con audit.
- **Sync offline** — invertir en test suite de conflictos temprano (S5).

---

## Resumen ejecutivo

- **Total tickets Fase 01:** ~110 (S0-S8) = 8 sprints × ~14 tickets promedio.
- **Total tickets Fase 02:** ~40 (S9-S12) = 4 sprints × ~10 tickets promedio.
- **Sizing agregado estimado:** ~180 person-days Fase 01 con team de 3 = ~60 días laborales = **12 semanas críticas** + 4 semanas de QA/piloto = 16 semanas ✅ coincide con propuesta.
- **Fase 02:** ~90 person-days = ~30 días laborales × 2 devs = **8 semanas** ✅ coincide.

---

## Referencias

- Análisis referencia → `01-analisis-referencia-krux.md`
- Spec funcional → `02-spec-funcional.md`
- Modelo de datos → `03-modelo-datos.md`
- Pantallas → `04-pantallas.md`
