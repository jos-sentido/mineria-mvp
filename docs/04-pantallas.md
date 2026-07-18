# Inventario de pantallas — App móvil + Dashboard web

Convenciones:
- **[APP]** = React Native (iOS + Android)
- **[WEB]** = Dashboard React (Next.js)
- **[MVP]** = Fase 01 · **[F2]** = Fase 02
- **A11y** = accessibility notes cuando aplique
- Cada pantalla tiene: propósito, componentes clave, data que consume, estados, permisos por rol.

---

## PARTE A — APP MÓVIL (React Native)

Diseño mobile-first para uso real en mina: **guantes, polvo, mano sudada, sol directo**.
Regla de UX: pantallas grandes, un solo propósito por vista, tap targets ≥ 48x48 dp, contraste ≥ 4.5:1.

---

### A.1 [APP] Login + selección de tenant [MVP]

**Propósito:** autenticar al usuario y cargar su contexto.
**Componentes:**
- Logo Sentido / branding cliente.
- Input email, input password.
- Botón "Iniciar sesión" grande.
- Link "Olvidé contraseña" → flujo email.
- Toggle idioma ES/EN.
- Indicador de conexión (offline chip).
**Estados:** idle, loading, error credenciales, error red (con retry), sesión activa.
**A11y:** labels explícitos, error announcements.

### A.2 [APP] Home / selector de turno [MVP]

**Propósito:** el perforista/supervisor elige turno y rig del día.
**Componentes:**
- Nombre y foto usuario.
- Card de turno del día (fecha, tipo día/noche, rig asignado).
- Botón "Comenzar turno" o "Continuar turno en progreso".
- Lista de turnos recientes (últimos 5).
- Chip offline si aplica + botón "Sincronizar ahora".
**Data:** shifts asignados al driller del usuario, DSRs recientes.
**Rol:** DRILLER, SUPERVISOR.

### A.3 [APP] Captura DSR — Header [MVP]

**Propósito:** metadata de arranque del DSR.
**Componentes:**
- Contrato activo (chip).
- Pozo activo (selector con búsqueda).
- Profundidad de inicio (input numérico grande).
- PO number override (opcional).
- Botón "Guardar y continuar".
**Validaciones live:** profundidad inicio ≥ profundidad final del último DSR del mismo pozo.

### A.4 [APP] Captura DSR — Actividades [MVP]

**Propósito:** registrar bloques de tiempo del turno.
**Componentes:**
- Timeline vertical de bloques de actividad (drag to reorder).
- Cada bloque: categoría (icon), código, minutos, profundidad from-to si aplica.
- Botón "+ Agregar actividad" grande.
- Sub-vista modal: selector de actividad (búsqueda + favoritos), duración con teclado numérico grande, profundidad opcional.
- Barra superior: total minutos vs minutos del turno (8h = 480 min). Rojo si excede.
**Validación:** ∑ duraciones ≈ duración del turno ± 15 min. Warning bloqueante si delta > tolerancia.

### A.5 [APP] Captura DSR — Consumibles [MVP]

**Propósito:** registrar barrenas, lubricantes, agua, aditivos usados.
**Componentes:**
- Búsqueda de consumibles **filtrada por contrato** (no ve items ajenos).
- Cada item: nombre, unidad, cantidad, botón + / -.
- Costo estimado del turno (opcional visible según rol).
**Optimización campo:** favoritos primero, autocompletado tipo POS.

### A.6 [APP] Captura DSR — Paros (Downtime) [MVP]

**Propósito:** registrar tiempos improductivos con causa.
**Componentes:**
- Botón "+ Registrar paro".
- Selector categoría (mecánico / logístico / humano / clima / power / safety / otro).
- Duración + justificación de texto (obligatoria si categoría penalizable).
- Foto opcional como evidencia.
**Validación:** ∑ paros ≤ tiempo total no drilling del turno.

### A.7 [APP] Captura DSR — Core Recovery [MVP]

**Propósito:** capturar recuperación de núcleo (perforación diamantina).
**Componentes:**
- Intervalo profundidad from-to.
- Metros recuperados.
- % automático (calc).
- RQD opcional.
- Config equipo pre-cargada.
**Visible solo si rig type = DIAMOND_CORE.**

### A.8 [APP] Captura DSR — Incidentes [MVP]

**Propósito:** reportar accidentes, daños, cuasi-accidentes.
**Componentes:**
- Tipo (injury / damage / spill / near-miss / other).
- Severidad.
- Descripción libre.
- Fotos evidencia.
- Alerta visible al supervisor y coordinador inmediatamente al sync.

### A.9 [APP] Captura DSR — Timesheet [MVP]

**Propósito:** horas-hombre por miembro de cuadrilla.
**Componentes:**
- Lista de driller de la cuadrilla.
- Horas ordinarias + overtime por cada uno.
- Total inferior.

### A.10 [APP] Captura DSR — Revisión y firma [MVP]

**Propósito:** el perforista revisa todo y firma antes de enviar.
**Componentes:**
- Resumen colapsable de todas las secciones anteriores.
- Metros perforados totales (grande).
- Firma digital (canvas dibujo con dedo).
- Botón "Enviar a supervisor" (grande, primario).
- Botón "Guardar borrador".
**Estados:** DRAFT (guardado local), READY_TO_SEND (validado ok), SUBMITTED (enviado a sync).

### A.11 [APP] Bandeja de supervisor [MVP]

**Propósito:** el supervisor ve DSRs pendientes de aprobar.
**Componentes:**
- Lista de DSRs con estado IN_REVIEW filtrada por sus rigs.
- Cada tarjeta: perforista, rig, hole, metros, alertas visuales (paros injustificados, incidentes).
- Tap → vista detalle.
**Rol:** SUPERVISOR.

### A.12 [APP] Detalle DSR — Supervisor aprueba/rechaza [MVP]

**Propósito:** revisar detalle y decidir.
**Componentes:**
- Todo lo capturado por el perforista, read-only con opción "editar".
- Log de cambios si edita (visible en audit).
- Botones "Aprobar y firmar" / "Rechazar con motivo".
- Textarea de motivo si rechaza.

### A.13 [APP] Tareas del pozo (Hole tasks) [MVP]

**Propósito:** el operador de campo ve checklist pre/post por pozo asignado.
**Componentes:**
- Selector de pozo.
- Lista de tareas pendientes con checkboxes.
- Cada tarea: descripción, adjuntar evidencia (foto), asignado a, fecha objetivo.
- Marcado bloqueado si requiere evidencia y no la subió.

### A.14 [APP] Bandeja de sync + conflictos [MVP]

**Propósito:** ver estado de sincronización y resolver conflictos.
**Componentes:**
- Lista de items pendientes sync (contador).
- Botón "Sincronizar ahora".
- Sección "Conflictos" — un DSR que servidor modificó vs local.
- Cada conflicto: side-by-side, botón "usar local", "usar servidor", "combinar".

### A.15 [APP] Perfil + configuración [MVP]

- Cambio de idioma, cambio de contraseña, cerrar sesión.
- Info del dispositivo (device_id, versión app).
- Botón "Reportar problema" (envío log al backend).

### A.16 [APP] Consulta rápida IA [F2]

**Propósito:** perforista/supervisor pregunta en lenguaje natural.
**Componentes:**
- Chat de mensajes.
- Contexto de pantalla actual auto-pasado.
- Botones de "sugerencias" según screen.

---

## PARTE B — DASHBOARD WEB (Next.js)

Diseño desktop-first pero responsive. Sidebar navegación + header contextual.
Regla de UX: mostrar data primero, controles después. Cargas < 2s.

---

### B.1 [WEB] Login [MVP]

Estándar: email / password / recovery / SSO opcional [F2].

### B.2 [WEB] Home ejecutivo [MVP]

**Propósito:** vista de un vistazo del estado global de operación.
**Componentes:**
- **KPI tiles** (metros hoy, metros mes, rigs activos, standby %, DSR pendientes de aprobar).
- **Mapa live** de sitios y máquinas (diferenciador Sentido). Click a rig → drill-down.
- **Alertas** activas (top 5).
- **Actividad reciente** stream (últimos DSRs, aprobaciones, incidentes).
- Selector rango fecha (default últimos 30 días).
**Rol:** todos excepto DRILLER.

### B.3 [WEB] Mapa geográfico [MVP]

**Propósito:** vista geo-espacial de la operación.
**Componentes:**
- Mapa base (Mapbox u OpenStreetMap).
- Pines de sitios (agrupados por región).
- Estado de cada rig como color (verde ok, amarillo standby, rojo mantenimiento).
- Filtros (sitio, rig, tipo).
- Panel lateral con detalle al click.

### B.4 [WEB] Sitios — Lista y detalle [MVP]

- Tabla ordenable de sitios con métricas resumidas (rigs activos, metros mes, contratos activos).
- Detalle: mapa del sitio, rigs asignados, pozos activos, programa vigente.

### B.5 [WEB] Rigs — Lista y detalle [MVP]

- Lista con estado, ubicación actual, DSR de hoy, KPI de la semana.
- Detalle rig: histórico, mantenimiento, horas totales, DSRs asociados, gráfica de rendimiento.

### B.6 [WEB] Bandeja DSRs [MVP]

**Propósito:** centro de operación para el coordinador.
**Componentes:**
- Filtros: rango fecha, sitio, rig, estado, perforista, contrato.
- Tabla con acciones bulk (aprobar múltiples, exportar).
- Chip de estado con color.
- Búsqueda por número de DSR o pozo.

### B.7 [WEB] Detalle de DSR [MVP]

**Propósito:** ver el DSR completo y su historia.
**Componentes:**
- Panel superior: metadata, estado con timeline visual (borrador → en revisión → aprobado → final).
- Tabs: Actividades / Consumibles / Paros / Core / Timesheet / Incidentes / Audit.
- Botones: Solicitar corrección · Marcar final · Anular con reemplazo.
- Cada línea del DSR con enlace a la fila afectada (facturación, nómina).

### B.8 [WEB] Contratos — Lista y editor [MVP]

- Lista: nombre, cliente, estado, avance %, ingreso acumulado.
- Editor por tabs:
  - **Info** (partes, fechas, divisa, ciclo de facturación).
  - **Rigs y sitios** cubiertos.
  - **Tarifas** (por metro / hora / actividad / tier profundidad).
  - **Bonos** (con condition builder visual).
  - **Penalizaciones**.
  - **Hitos de pago**.
  - **Consumibles autorizados**.
- Preview: "así se factura un DSR ejemplo con este contrato".

### B.9 [WEB] Condition builder para bonos/penalizaciones [MVP]

**Propósito:** UI para construir reglas sin código.
**Componentes:**
- Selector métrica (metros mes, paros %, safety score, avance vs meta).
- Operador (>=, <=, ==, entre).
- Valor.
- Monto (fijo o %).
- Vista JSON generado.

### B.10 [WEB] Programa / campañas [MVP]

**Propósito:** planificación de campaña (Krux Scheduler equivalent).
**Componentes:**
- Vista **Gantt** por rig con pozos programados.
- Vista **Calendario** mensual.
- Vista **Mapa** con pozos planeados vs ejecutados.
- Drag & drop para reasignar.
- Import CSV de plan.
- Estimador de duración por histórico similar.

### B.11 [WEB] Pozos — Lista y detalle [MVP]

- Lista filtrable: estado, sitio, programa, rig asignado.
- Detalle:
  - Metadata (azimuth, dip, profundidad objetivo vs actual).
  - **Trayectoria (survey)** en gráfica 2D/3D básica.
  - Task manager pre/post con progreso.
  - DSRs asociados en timeline.
  - Costo acumulado.

### B.12 [WEB] Task manager — vista global [MVP]

**Propósito:** coordinador ve tareas pendientes en todos los pozos.
**Componentes:**
- Kanban por fase (pre / en perforación / post).
- Filtro por sitio, asignado, vencimiento.
- Click tarea → modal con evidencia y comentarios.

### B.13 [WEB] Consumibles — Catálogo y stock [MVP]

- CRUD del catálogo.
- Import CSV bulk.
- Vista de consumo por contrato/rig/periodo.
- Alertas de stock bajo [CFG por rig].

### B.14 [WEB] Actividades — Catálogo [MVP]

- CRUD del catálogo por tenant.
- Etiqueta ES/EN, categoría, facturable sí/no.

### B.15 [WEB] Personal — Perforistas y cuadrillas [MVP]

- Lista de drillers con status, certificaciones, tarifa base.
- Assignación de cuadrilla → rig.
- Historial de turnos.

### B.16 [WEB] Facturación — Periodos y facturas [MVP]

**Propósito:** contabilidad procesa cierre de periodo.
**Componentes:**
- Lista de periodos por contrato con status.
- Detalle periodo: DSRs incluidos, subtotales por categoría (metros, actividades, consumibles, bonos, penalizaciones).
- Botón "Generar factura" → preview PDF.
- Editor de factura (agregar cargos extra, rentals).
- Marcar como emitida / pagada.

### B.17 [WEB] Nómina — Corridas y detalle [MVP]

- Similar a facturación pero para perforistas.
- Cálculo base + rendimiento + bonos por driller.
- Export XLSX para dispersión bancaria.

### B.18 [WEB] Reportes — Biblioteca y generador [MVP]

- Biblioteca de templates: operativos, financieros, ESG (F2), contractuales, custom.
- Generador con filtros: rango, sitio, rig, contrato.
- Preview antes de export.
- Formatos PDF / XLSX / CSV.
- Runs recientes con re-download.

### B.19 [WEB] Alertas [MVP + F2]

- Lista de alertas activas (contract deviation, unjustified downtime, anomaly, safety).
- Marcar como ack + comentario.
- [F2] Alertas generadas por IA visibles con fuente.

### B.20 [WEB] IA — Chat consciente de contexto [F2]

- Panel lateral colapsable disponible en toda pantalla.
- Contexto auto-adjuntado (mina activa, filtros).
- Cita fuentes de la respuesta.
- Sugerencias contextuales por pantalla.

### B.21 [WEB] Admin — Tenant [MVP]

- Info del tenant, divisa default, idioma default, timezone.
- Configuración de multi-idioma y branding.
- Reglas de cierre de periodo (auto/manual).

### B.22 [WEB] Admin — Usuarios y roles [MVP]

- CRUD de usuarios.
- Invitación por email.
- Asignación de roles con scope (global / sitio / rig / contrato).
- MFA setup [F2].
- Log de accesos.

### B.23 [WEB] Admin — Integraciones [MVP básico + F2 completo]

- API keys generadas para integraciones externas.
- Config de webhooks.
- Setup de connectors (SAP, Leapfrog, IMDEX, acQuire) [F2].

### B.24 [WEB] Admin — Datos maestros [MVP]

- Regiones, sitios, tipos de rig, categorías de actividad, categorías de paro.
- Templates de tarea por pozo (default para nuevos pozos).

### B.25 [WEB] Auditoría [MVP]

- Búsqueda full-text del audit_log.
- Filtros por actor, entidad, acción, rango fecha.
- Export legal (PDF firmado [F2]).

### B.26 [WEB] Vista limitada del stakeholder externo [MVP]

**Propósito:** cliente final (si tenant es service provider) ve solo su contrato.
**Componentes:**
- Avance del contrato.
- Factura del periodo actual.
- DSRs read-only sin costos internos.
- Descarga de reportes autorizados.

### B.27 [WEB] Sistema — Estado + logs [MVP]

- Uptime, últimos deploys, health de servicios.
- Solo TENANT_ADMIN.

### B.28 [WEB] 404 / 403 / Error boundary [MVP]

Vistas estándar, sin filtrar info sensible.

---

## PARTE C — Vistas transversales

- Search global (Cmd/Ctrl+K) — [MVP] pozos, DSRs, contratos, usuarios.
- Command palette con acciones frecuentes [F2].
- Modo oscuro toggle [MVP] — combina con hero de la propuesta (var color scheme).

---

## D — Resumen del inventario

| Categoría | # pantallas | Fase |
|---|---|---|
| App móvil (React Native) | 16 | 15 MVP + 1 F2 |
| Dashboard web (Next.js) | 28 | 25 MVP + 3 con F2 |
| **Total** | **44** | **40 MVP + 4 F2** |

---

## E — Priorización sugerida para diseño / prototipado

Semana 1-2 de diseño (Figma):
1. Login + Home móvil + selector de turno → A.1, A.2
2. Captura DSR (A.3 → A.10) — el flujo más crítico
3. Home ejecutivo + Mapa (B.2, B.3)
4. Bandeja DSRs + Detalle (B.6, B.7)
5. Editor de contrato (B.8 + B.9)

Semanas 3-4 diseño:
6. Programa / Scheduler (B.10)
7. Task manager (B.12)
8. Facturación (B.16, B.17)
9. Reportes (B.18)
10. Admin (B.21-B.24)

El resto en semanas 5+ mientras el desarrollo arranca en paralelo con lo ya diseñado.

---

## F — Referencias

- Modelo de datos que alimenta cada pantalla → `03-modelo-datos.md`
- Spec funcional con flujos completos → `02-spec-funcional.md`
- Tickets accionables por pantalla → `05-backlog.md`
