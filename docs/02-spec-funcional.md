# Especificación funcional MVP — Plataforma de gestión de perforación

**Cliente inicial:** minera dueña en Zacatecas (rol *resource owner*)
**Arquitectura:** multi-rol — sirve también a service providers y operaciones integradas
**Base comparativa:** Krux Analytics (KruxLog + KruxMetrix)
**Alcance MVP:** paridad funcional con Krux + diferenciadores Sentido (IA, mapa live, ESG, propiedad total)

---

## 0. Convenciones del documento

- **[MVP]** = obligatorio en Fase 01 (16 semanas)
- **[F2]** = Fase 02 (personalización + IA + histórico)
- **[F3]** = Fase 03 / roadmap (IoT)
- **[CFG]** = configurable por tenant
- **AC** = criterio de aceptación
- Todas las cantidades $ en MXN salvo indicación.

---

## 1. Objetivo del sistema

Reemplazar el software extranjero de gestión de perforación por una plataforma propia que:
1. Captura DSR (Daily Shift Report / plod) en mina — offline-first, con doble aprobación.
2. Consolida operación multi-sitio en tiempo real en oficina.
3. Automatiza facturación (proveedor → minera) y nómina (minera → perforista).
4. Trackea contratos, reconcilia costos, genera reportes ejecutivos/ESG.
5. Provee IA operativa consciente de contexto para reducir decisiones ciegas.
6. Es propiedad total de la minera desde el día 1 (código, BD, cuentas).

---

## 2. Actores y roles

### 2.1 Roles operativos (usuarios finales)

| Rol | Contexto | Permisos MVP |
|---|---|---|
| **Perforista / driller** | En mina, con guantes. App móvil offline. | Captura DSR; ve solo su rig/turno; no ve costos ni contratos |
| **Supervisor de turno / capitán** | En mina o campamento. App móvil online/offline. | Aprueba DSR de perforistas; edita antes de enviar; ve rendimiento del turno |
| **Coordinador de operación** | Oficina de sitio. Dashboard web. | Ve todos los rigs del sitio; genera reportes; asigna tareas de pozo |
| **Director / gerencia** | Corporativo. Dashboard web. | Vista multi-sitio; KPIs consolidados; dashboards ejecutivos |
| **Contabilidad / facturación** | Corporativo. Dashboard web. | Genera facturación al cliente / nómina de perforistas; concilia costos |
| **Cliente / stakeholder externo** | Cliente final de la minera si es service provider. | Vista limitada al contrato: avance, facturas, ESG |
| **Admin de tenant** | IT o operaciones senior. | Configura contratos, tarifas, sitios, usuarios, integraciones |

### 2.2 Rol de organización (multi-tenant)

Cada instancia (tenant) declara su tipo — determina qué módulos ve por default:

- **RESOURCE_OWNER** (minera dueña) — modo del cliente actual. Ve pagos salientes, plan geológico, ESG.
- **SERVICE_PROVIDER** (empresa perforadora) — ve cobros entrantes, nómina, KPI de rigs propios.
- **INTEGRATED** (minera con perforación en casa) — ambas vistas, sin facturación externa.

El schema soporta las 3 desde el día 1 (ver `03-modelo-datos.md`).

---

## 3. Alcance MVP consolidado

Basado en respuesta del cliente: **todos los gaps vs Krux entran a MVP**. Alcance ampliado respecto a la propuesta comercial actual (implicación: revisar cotización antes de firmar).

### 3.1 Módulos MVP

| # | Módulo | Origen | Notas |
|---|---|---|---|
| M01 | Autenticación + multi-tenant + roles | Base | SSO opcional |
| M02 | Captura DSR offline (app móvil) | Krux paridad | Núcleo del sistema |
| M03 | Doble aprobación DSR | Krux paridad | Perforista → supervisor → oficina |
| M04 | Catálogo consumibles por contrato | Krux paridad | El perforista solo ve lo relevante |
| M05 | Motor de contratos flexibles | Krux paridad | Tarifas, bonos, penalizaciones, hitos |
| M06 | PO numbers en DSR | Krux paridad (gap propuesta) | Referencia de orden de compra |
| M07 | Survey / trayectoria de pozo | Krux paridad (gap propuesta) | Import CSV + captura manual |
| M08 | Core Recovery Calculator | Krux paridad (gap propuesta) | Cálculo automático de recuperación |
| M09 | Hole Task Manager | Krux paridad (gap propuesta) | Tareas pre/post perforación |
| M10 | Timesheet horas-hombre | Krux paridad (gap propuesta) | Base para nómina |
| M11 | Reconciliación de costos en tiempo real | Krux paridad | Barrena, lubricante, hora-máquina |
| M12 | Dashboard multi-sitio con KPIs | Krux paridad | Tendencias, drill-down |
| M13 | Krux Scheduler equivalente (planning) | Krux paridad (gap propuesta) | Calendario de campañas |
| M14 | Facturación automática (proveedor → minera) | Krux paridad | Desde DSR validado |
| M15 | Nómina automática (rendimiento + bonos) | Krux paridad | Desde DSR + timesheet |
| M16 | Exportaciones estructuradas PDF/Excel/CSV | Krux paridad | Plantillas configurables |
| M17 | Reportes ejecutivos | Krux paridad | Roles diferenciados |
| M18 | Auditoría / log inmutable | Krux paridad | Compliance |
| M19 | **Mapa geográfico live minas + máquinas** | Diferenciador Sentido | Reusar patrón OOH |
| M20 | Multilingüe ES/EN | Krux paridad | Base + toggle usuario |
| M21 | API REST + Smart export (`?since=`) | Krux paridad | Base de integraciones |

### 3.2 Fase 02 (post-MVP)

- M22 IA operativa consciente de pantalla (bot conversacional).
- M23 Alertas proactivas por IA (desviaciones, paros injustificados, anomalías).
- M24 Análisis automatizado de paros con clasificación IA.
- M25 Import histórico desde plataforma actual del cliente.
- M26 Reportes ESG (huella carbono, social, gobernanza).
- M27 Integración con modelo geológico (Leapfrog / Micromine / Vulcan) — export estructurado.
- M28 Integración ERP (SAP / Bind / Odoo) — bidireccional.
- M29 Arquitectura multi-tenant lista para licenciamiento comercial.

### 3.3 Fase 03 (roadmap IoT)

- M30 Ingesta IoT desde rigs (KruxDAQ-equivalente).
- M31 Mantenimiento predictivo.
- M32 Métricas de consumo energético / huella carbono desde sensor.

### 3.4 Fuera de alcance (WON'T)

- Módulo completo de RRHH (contratación, evaluaciones).
- Procurement / compras.
- Seguridad industrial formal / permisos de trabajo.
- CRM / prospección.

---

## 4. Flujos principales (end-to-end)

### 4.1 Flujo A — Captura y validación de DSR

**Actor:** perforista → supervisor → coordinador oficina
**Objetivo:** transformar un turno de perforación en data validada facturable/nominable.

1. Perforista abre app móvil (offline). Selecciona su turno del día, rig asignado, pozo activo.
2. Durante el turno captura eventos:
   - Metros perforados por sección (profundidad de inicio, fin).
   - Actividades (perforación, movilización, cementación, standby, mantenimiento).
   - Consumibles usados (barrena X — sale de catálogo filtrado por contrato).
   - Paros (con causa clasificada: mecánico / logístico / humano / clima).
   - Core recovery (si aplica) — calculado automático desde config equipo.
   - Timesheet (horas-hombre por turno).
3. App valida en tiempo real:
   - Profundidad final > profundidad inicial. AC: rechazar y mostrar mensaje.
   - Valores dentro de rangos razonables ([CFG] por contrato). AC: warning bloqueante.
   - Todos los tiempos suman al total del turno ± tolerancia. AC: mostrar delta.
4. Al cierre de turno, perforista firma digital y envía a supervisor.
5. Supervisor recibe (push si online, próximo sync si offline). Puede editar con auditoría o rechazar con motivo.
6. Supervisor aprueba → DSR pasa a estado `APROBADO`. Se sincroniza a backend al recuperar señal.
7. Coordinador de oficina ve el DSR en dashboard. Puede solicitar corrección (regresa a supervisor) o marcar como final.
8. DSR final dispara: actualización de KPIs, reconciliación de costos contra contrato, disponibilidad para facturación.

**AC del flujo:**
- Captura 100% funcional sin señal.
- Sync tolerante a re-conexión intermitente (retry con backoff).
- Estado del DSR visible en app y web en todo momento.
- Auditoría completa: quién capturó, quién editó, quién aprobó, cuándo.

### 4.2 Flujo B — Contrato, reconciliación y facturación

**Actor:** admin de tenant → sistema → contabilidad
**Objetivo:** que cada DSR aprobado se traduzca automáticamente en factura o pago.

1. Admin crea contrato en dashboard:
   - Partes (proveedor + cliente).
   - Rigs asignados.
   - Sitios / minas cubiertos.
   - Tarifas: por metro perforado, por hora-máquina, por actividad, por profundidad.
   - Bonos: por cumplimiento de meta mensual, por safety, por eficiencia.
   - Penalizaciones: por standby > umbral, por incidente, por retraso.
   - Hitos: pagos parciales al alcanzar profundidad X.
2. Cada DSR aprobado corre contra el contrato del rig:
   - Multiplica metros × tarifa aplicable.
   - Suma bonos si condiciones se cumplen.
   - Descuenta penalizaciones si aplican.
   - Reconcilia costos (barrena × precio, hora-máquina × costo horario).
3. Sistema mantiene ledger vivo por contrato:
   - Avance % vs meta.
   - Metros perforados vs planeados.
   - Ingreso/costo acumulado.
   - Alertas si desviación > [CFG]%.
4. Al cierre de periodo (semanal/quincenal/mensual [CFG]):
   - Contabilidad genera factura al cliente desde totales del contrato.
   - Contabilidad genera nómina del perforista desde su rendimiento + bonos.
   - Ambos documentos exportables PDF con plantilla configurable.

**AC del flujo:**
- Cada línea de la factura trazable hasta un DSR específico.
- Cada bono/penalización con justificación auditable.
- Recalcular contrato al editar tarifa histórica (con confirmación de auditoría).

### 4.3 Flujo C — Planning y ejecución de campaña

**Actor:** coordinador → coordinador
**Objetivo:** planificar campaña de perforación con calendario y monitorear ejecución vs plan.

1. Coordinador crea *program* (campaña) — colección de pozos programados.
2. Para cada pozo del programa define: profundidad objetivo, ubicación (coord), rig asignado, tarea pre-perforación (permisos, survey previo), fecha objetivo.
3. Sistema calcula duración estimada por pozo desde histórico similar.
4. Dashboard muestra calendario multi-rig con estados (planned / in-progress / completed / delayed).
5. Al capturar DSR contra un pozo del programa, el sistema actualiza avance automático.
6. Alertas cuando pozo va > X% atrás de plan o rig está subutilizado.

**AC del flujo:**
- Reagendar pozo con drag simple en calendario.
- Vista Gantt por rig y vista mapa por sitio.
- Import de plan desde CSV/acQuire.

### 4.4 Flujo D — Task Manager por pozo

**Actor:** coordinador → equipo de campo
**Objetivo:** que ningún pozo se inicie ni cierre sin sus tareas críticas.

1. Cada pozo tiene checklist configurable de tareas pre (permisos, survey, movilización) y post (cementación, cierre, informe geológico).
2. Cada tarea con responsable, fecha objetivo, evidencia (foto/PDF).
3. Estado del pozo bloqueado hasta que checklist mínimo se cumpla ([CFG] cuáles son obligatorias).
4. Log de completado por tarea con timestamp y usuario.

### 4.5 Flujo E — Consulta con IA operativa [F2]

**Actor:** cualquier rol con permiso
**Objetivo:** hacer preguntas en lenguaje natural sobre operación sin exportar a Excel.

1. Usuario abre chat desde cualquier pantalla del dashboard.
2. Bot recibe: query + contexto de pantalla actual (mina activa, contrato, rango de fechas).
3. Bot responde en el idioma del usuario con:
   - Respuesta directa.
   - Cita a las filas/agregados que consultó.
   - Enlaces a las pantallas relevantes.
4. Preguntas frecuentes se guardan como *quick prompts* del usuario.

**AC del flujo:**
- Bot NUNCA inventa números — o cita fuente o dice "no tengo esa data".
- Latencia p50 < 4s, p95 < 8s.

---

## 5. Reglas de negocio críticas

R01. **Auditoría inmutable** — ninguna edición borra el histórico, todo cambio queda en audit log.
R02. **Un DSR final no se edita** — solo se anula y reemplaza con nuevo, con motivo.
R03. **Multi-tenant estricto** — un usuario solo ve data de su tenant. Enforzado en API + BD (RLS).
R04. **Zona horaria por sitio** — un turno de mina X se registra en su TZ local, se convierte a UTC para BD.
R05. **Idioma por usuario** — no por tenant. Un usuario mexicano ve ES aunque el corporativo esté en EN.
R06. **Cantidades monetarias en `decimal(18,4)`** — nunca float. Divisa por contrato.
R07. **Toda tarifa tiene vigencia** — `valid_from` / `valid_to`. Recálculo respeta vigencia al momento del DSR.
R08. **Backups automáticos** — snapshot diario BD, retención 30 días MVP.
R09. **Idempotencia en sync** — cliente móvil puede reintentar sin duplicar DSR (uuid v4 client-generated).
R10. **Rate limit API** — 60 rpm por usuario, 600 rpm por tenant [CFG].

---

## 6. Requisitos no funcionales

### 6.1 Performance

- Dashboard web: primera vista < 2s con 100k DSRs de histórico.
- App móvil captura: sin lag perceptible offline, < 500ms para cualquier interacción.
- Sync offline → online: 1000 DSRs pending → sync completo < 60s en 4G.
- Reportes PDF: generación < 10s para reporte de 12 meses.

### 6.2 Disponibilidad

- 99.5% MVP (43h/año caída aceptable — sin SLA formal).
- 99.9% target F2 con soporte contratado.

### 6.3 Seguridad

- HTTPS forzado, HSTS.
- JWT con expiración corta + refresh token.
- Passwords: bcrypt cost 12 mínimo.
- MFA opcional para admin [F2].
- Rate limiting anti-brute-force en login.
- Row Level Security (RLS) en Postgres por tenant.
- Backups cifrados.
- Logs sin PII innecesaria.

### 6.4 Cumplimiento

- Conservar DSRs mínimo 7 años (regulación minera MX).
- Reportes con firma digital verificable [F2].
- ESG framework alineado a GRI / SASB Mining [F2].

### 6.5 Compatibilidad

- App móvil: iOS 15+, Android 10+.
- Dashboard web: Chrome/Edge/Safari/Firefox últimas 2 versiones.
- No soporte IE. No soporte Android < 10.

---

## 7. Idioma, moneda, formatos

- Idiomas base: **ES** (default), **EN** (toggle). PT-BR y otros posteriores.
- Moneda base: **MXN**. Contratos pueden declarar otra divisa (USD, CAD).
- Unidades: **métricas** (metros, kg, litros). Toggle a imperial [F2] si algún cliente lo pide.
- Fechas: ISO 8601 en BD, formato local en UI.
- Formato numérico: separador de miles + 2 decimales por default.

---

## 8. Integraciones planeadas

### 8.1 MVP

- **Email** (Resend / SendGrid) — notificaciones y envío de reportes.
- **Push notifications** (FCM + APNs) — alertas a supervisor y coordinador.
- **Storage de archivos** (Supabase Storage) — evidencia fotográfica, reportes generados.
- **API REST propia** documentada en OpenAPI, con Smart Export (`?since=<timestamp>`).

### 8.2 Fase 02

- Modelo geológico (Leapfrog / Micromine / Vulcan) — export por hole.
- ERP (SAP / Bind / Odoo) — bidireccional facturas + costos.
- IMDEX HUB-IQ equivalente para survey [si cliente lo usa].
- Claude / OpenAI API — para módulo IA.

### 8.3 Fase 03

- Ingesta MQTT / OPC-UA desde rigs para IoT.

---

## 9. Estados del sistema (state machines críticos)

### 9.1 DSR

```
BORRADOR → EN_REVISION → APROBADO → FINAL
   ↓            ↓          ↓
CANCELADO   RECHAZADO   ANULADO
```

Transiciones:
- BORRADOR → EN_REVISION: perforista envía a supervisor.
- EN_REVISION → APROBADO: supervisor aprueba.
- EN_REVISION → RECHAZADO: supervisor rechaza (regresa a BORRADOR con motivo).
- APROBADO → FINAL: 24h sin objeción de oficina O acción manual del coordinador.
- FINAL → ANULADO: solo admin, requiere nuevo DSR reemplazo con referencia.

### 9.2 Pozo (hole)

```
PLANEADO → PRE_PERFORACION → EN_PERFORACION → POST_PERFORACION → COMPLETADO
                                     ↓
                                 SUSPENDIDO → EN_PERFORACION
                                     ↓
                                 ABANDONADO
```

### 9.3 Contrato

```
DRAFT → ACTIVO → EN_FACTURACION → CERRADO
           ↓
        SUSPENDIDO → ACTIVO
```

---

## 10. Criterios de aceptación globales del MVP

Para considerar el MVP entregado ("go-live") deben cumplirse:

1. **Captura offline verificada** — un perforista puede capturar 8h de turno sin señal y todo se sincroniza correctamente al recuperar.
2. **Doble aprobación funcionando** — el flujo perforista → supervisor → oficina está firmado con auditoría.
3. **Un DSR se traduce en peso monetario** — hay al menos 1 contrato configurado y un DSR de prueba se refleja en factura + nómina correcta.
4. **Dashboard responde con data real** — visto en producción con al menos 30 días de captura real de la minera.
5. **Reportes exportables** — al menos 3 plantillas PDF y 3 plantillas Excel funcionando.
6. **Mapa live** — muestra rigs con estado en < 5s de retraso.
7. **Multi-lingüe** — cualquier usuario cambia ES↔EN sin bugs de layout.
8. **Roles y permisos** — un perforista NO ve costos ni contratos. Verificado con test.
9. **Capacitación entregada** — al menos 1 sesión a oficina y 1 sesión en mina, con material grabado y escrito.
10. **Documentación técnica** — README, arquitectura, API docs (OpenAPI), runbook de operación.

---

## 11. Riesgos técnicos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Sync offline con conflictos (perforista edita en dos dispositivos) | Alto | UUID client-side + last-write-wins con audit; supervisor resuelve conflictos evidentes |
| Contratos con reglas exóticas del cliente | Alto | Discovery profundo en semana 0 con contabilidad; DSL simple para bonos custom |
| App móvil pesada en gama baja | Medio | Target Android 10 + 3GB RAM; auditar bundle size, lazy load módulos |
| Regulación minera MX que cambie campos obligatorios | Medio | Campos custom [CFG] por tenant; migraciones versionadas |
| IA que alucine números (F2) | Alto | Bot cita fuente siempre; si no puede citar, responde "no tengo esa data" |
| Latencia de Supabase en LATAM | Bajo | Región us-east-1 o us-west-1 con CDN Vercel; monitorear p95 |

---

## 12. Referencias cruzadas

- Análisis de referencia → `01-analisis-referencia-krux.md`
- Modelo de datos detallado → `03-modelo-datos.md`
- Inventario de pantallas → `04-pantallas.md`
- Backlog accionable → `05-backlog.md`
- Propuesta comercial original → `~/Sentido-repo/propuestas/perforaciones-zacatecas/index.html`
