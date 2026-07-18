# Análisis del software de referencia — Krux Analytics

Fuente: brochure PDF KRUX-Smart Software (ES) + navegación www.kruxanalytics.com (jul 2026).
Objetivo: entender qué construye Krux, para diseñar un MVP equivalente/superior sin ir a ciegas.

---

## 1. Estructura del producto Krux

Krux vende **tres piezas** bajo la misma plataforma:

| Producto | Tipo | Función |
|---|---|---|
| **KruxLog** | App móvil/tablet (offline-first) | Captura en campo por perforistas — reemplaza plod/DSR de papel |
| **KruxMetrix** | Web SaaS multi-tenant | Dashboard oficina, KPIs, reconciliación, facturación, planning |
| **KruxDAQ** | Ingesta IoT (roadmap) | Data de alta resolución directo del rig, huella de carbono, geología predictiva |

Nuestro alineamiento: propuesta Sentido replica **KruxLog + KruxMetrix** en Fases 01–02, y deja **KruxDAQ = Fase 03 (IoT)** como roadmap. Coincide.

---

## 2. Personas / roles

Krux modela tres audiencias, cada una con vistas y permisos distintos:

- **Driller / capitán / perforista** — captura en la app, reportes de turno, consumibles.
- **Service Provider (empresa perforadora)** — admin de rigs, contratos con clientes, facturación, nómina, KPIs por perforista/máquina.
- **Resource Owner (dueño de mina)** — reconciliación de costos, plan vs rendimiento, integración con modelos geológicos, análisis multi-sitio.

MVP Sentido debe soportar los 3 roles desde el día 1 aunque el primer cliente sea uno solo, porque el flujo de aprobación cruza las 3 partes.

---

## 3. Módulos KruxLog (app móvil)

Features declaradas por Krux:

### Captura de reporte de turno (DSR / plod)
- Interfaz mobile/tablet-first, valores predefinidos y autocompletado.
- Validaciones en momento de captura (rechazar profundidad menor a la última, valores fuera de rango).
- **100% offline** con sync automático al recuperar señal.
- Multilingüe (mínimo EN/ES).
- **Doble aprobación**: perforista → supervisor → envío a oficina.

### Consumibles filtrados por contrato
- El perforista sólo ve barrenas / lubricantes / partes relevantes al contrato activo. Reduce errores y captura basura.

### Etiquetas / tags de proyecto
- Categorizar reportes por sitio, campaña, cliente final.

### Advanced Core Recovery Calculator
- Cálculo automático de recuperación de núcleo en tiempo real según configuración de equipo.

### Otros
- SSO empresarial.
- PO numbers embebidos en reportes para facturación posterior.

---

## 4. Módulos KruxMetrix (dashboard web)

### Dashboards y KPIs
- Vistas interactivas con métricas críticas por rig, pozo, perforista, contrato.
- **Enhanced KPI Management** — metas configurables a nivel individual (perforista), tipo (rig X vs rig Y) o grupos custom.
- Detección de tendencias y drill-down desde totales hasta un turno específico.

### Krux Scheduler (planning)
- Planificación de campañas con vista de calendario.
- Se apoya en data histórica real, no en supuestos.
- Comparativo plan vs ejecución en tiempo real.

### Hole Task Manager
- Centraliza tareas pre-perforación (movilización, permisos, survey) y post-perforación (cementación, cierre, reportes).
- Estado en vivo por pozo.

### Reconciliación y contratos
- **Motor de contratos flexibles** — tarifas múltiples, bonos, penalizaciones, hitos por profundidad, actividades específicas.
- Aprobación bilateral: proveedor y dueño de mina validan tarifas antes de que se dispare facturación.
- **Reconciliación de costos en tiempo real** — cada barrena, hora-máquina, hora-hombre se cruza contra el contrato al capturarse.

### Facturación y nómina automatizadas
- Reportes de facturación al cliente final generados desde data ya validada.
- Reportes de nómina para el perforista (base + rendimiento + bonos) desde la misma data.
- PO numbers ya vienen del reporte de turno.

### Análisis avanzado
- Costos por metro perforado.
- Tasa de penetración vs costo por profundidad.
- Bit-on-bottom time (tiempo de broca en contacto).
- Standby time por causa.
- Match óptimo rig ↔ pozo según histórico.

### Reportes exportables
- PDF, Excel, CSV con plantillas configurables.
- Reportes operativos, financieros y de contrato.
- Nota: **no** hay mención de ESG en Krux. Sentido lo puso en la propuesta — es diferenciador nuestro, no un requisito de mercado replicado.

---

## 5. Integraciones que Krux ya trae (relevante para diseño de APIs)

| Sistema externo | Uso | Implicación para Sentido |
|---|---|---|
| **IMDEX HUB-IQ** | Datos de survey de trayectoria del pozo | Diseñar API de ingesta de survey (o al menos import CSV) |
| **MaxGeo / DataShed5** | Sync de DSR/plod para análisis geológico | Export estructurado por pozo con schema estándar |
| **Seequent Leapfrog** | Modelo 3D geológico — cruce con perforación y costos | Export por hole con coord + rate + cost |
| **acQuire** | Import de plan de perforación | API de import de plan (metros programados, hitos) |
| **Smart API / Export API** | Data incremental (solo lo modificado desde X) | Nuestro API debe soportar `?since=timestamp` |

Estas integraciones definen **el mínimo aceptable** de nuestra capa API si queremos que ese cliente considere migrar.

---

## 6. Entidades de dominio identificadas

Del análisis de features se deducen las entidades núcleo (base para el schema en `03-modelo-datos.md`):

- **Site / Region / Corporate** — jerarquía geográfica multi-nivel
- **Hole** (pozo/agujero) — la unidad principal del negocio
- **Program / Plan** — conjunto de holes planeados
- **Rig / Drill Platform** (máquina de perforación)
- **Driller** (perforista) — vinculado a turno, rig, contrato
- **Shift** (turno) — unidad temporal de captura
- **DSR / Plod** (reporte de turno) — objeto central de captura
- **Contract** — con tarifas, bonos, penalizaciones
- **Rate / Tariff** — múltiples por contrato, por actividad
- **Activity** (perforación, cementación, movilización, standby, mantenimiento)
- **Consumable** (barrena, lubricante, agua, aditivos) — filtrado por contrato
- **Equipment** — inventario de rigs, herramientas, brocas
- **Standby / Downtime** — con clasificación (mecánico, logístico, humano, clima)
- **Additional Charge / Rental**
- **Survey** — trayectoria del pozo
- **Timesheet** — horas-hombre
- **PO Number**
- **User / Role / Permission**
- **Approval / Audit Log**
- **Task** (pre y post perforación por pozo)

---

## 7. KPIs y métricas que Krux vende como resultado

Números que Krux usa como prueba social. Los guardamos como **targets del MVP**:

| Métrica | Resultado publicado por Krux |
|---|---|
| Rapidez de reportes mensuales | 90% más rápidos |
| Horas admin ahorradas | Hasta 40 hrs/mes |
| Reducción de standby | Hasta 30% |
| Ahorro admin (Capital Drilling) | 42% |
| Ahorro operativo (Kinross) | 1 hora/día, +1 pozo en 2 meses |
| Ahorro operativo (Zenex, PNG) | 24 hrs/mes, escaló a 6 rigs |

Casos que Krux publica: Kinross Gold, Barrick Gold, MAC Copper, Aeris Resources, Capital Drilling, Zenex, Swick, Egan, Rodren, Mineral Mining Services (MMS).

---

## 8. Gaps y oportunidades vs Krux

Cosas donde Sentido debe ser **igual o mejor**:

- ✅ Offline-first, doble aprobación, contratos flexibles, facturación auto → paridad obligada.
- ✅ Integraciones geológicas (Leapfrog, IMDEX) → mínimo API de export estándar por pozo.
- ✅ Multi-lingüe (ES/EN).

Cosas donde Sentido puede **diferenciarse**:

- 🟢 **IA operativa consciente de pantalla** — Krux no la tiene, es diferenciador único.
- 🟢 **Mapeo geográfico interactivo de minas/máquinas** — Krux tiene KPIs por sitio pero no un mapa live como el que ya corre en el sistema OOH de Sentido.
- 🟢 **ESG** — Krux no vende esto explícitamente. Puede volverse diferenciador en México/LatAm por presión regulatoria.
- 🟢 **Propiedad total del código y BD** — Krux es SaaS. Nuestro pitch de "activo propio" es literalmente lo contrario del modelo Krux.
- 🟢 **Costo** — Krux cotiza suscripción indefinida en USD. $150k MXN one-time es un ancla comercial radicalmente distinta.

Cosas que Krux tiene y **NO** está en la propuesta actual (revisar si entran a MVP o Fase 2):

- ⚠️ **Krux Scheduler / planning con calendario** — la propuesta habla de "tracking metro a metro" pero no de planificación de campañas futuras. Faltaría.
- ⚠️ **Hole Task Manager** (tareas pre/post perforación) — no aparece en los entregables actuales. Faltaría.
- ⚠️ **Core Recovery Calculator** — específico técnico de perforación, no está mencionado. Preguntar al cliente si lo usa.
- ⚠️ **PO numbers en reporte** — no aparece en spec de la propuesta pero es clave para facturación real.
- ⚠️ **Survey data** (trayectoria del pozo) — no mencionado. En perforación de exploración es crítico.
- ⚠️ **Timesheet / horas-hombre** como entidad de primera clase — se menciona como cálculo pero no como módulo.

---

## 9. Preguntas abiertas para el cliente (discovery)

Antes de escribir la spec funcional, hay que confirmar con la minera de Zacatecas:

1. **¿Qué usan hoy?** ¿Es Krux mismo, otro (Devico, Boyd, IMDEX), o Excel + WhatsApp?
2. **Tipo de perforación**: exploración diamantina, producción, RC, tunelería. Cambia entidades y KPIs.
3. **¿Manejan survey (trayectoria)?** Sí = necesitamos módulo.
4. **¿Facturan al cliente final o son operación propia?** Cambia el motor de contratos.
5. **¿Cuántos rigs, sitios, perforistas, contratos activos?** Determina complejidad multi-tenant.
6. **¿Integran con ERP (SAP, Bind, Odoo)?** Define la capa de export.
7. **¿Reportes a autoridad (SENER, Secretaría de Economía, ESG)?** Define reportes regulatorios MX.
8. **¿Qué se rompe hoy?** El top-3 dolor real. Guía priorización del MVP.
9. **¿Idioma del usuario final en mina?** ES probable pero confirmar (multilingüe).
10. **¿Modelo geológico?** ¿Usan Leapfrog / Micromine / Vulcan? Define integración.

---

## 10. Recomendación de alcance MVP (input para `02-spec-funcional.md`)

Basado en el análisis, propongo estructurar el MVP así:

**MUST — Fase 01 (16 semanas, $110k):**
- KruxLog-equivalente: captura DSR offline con doble aprobación, consumibles por contrato, multilingüe.
- KruxMetrix-equivalente básico: dashboard con KPIs por rig/pozo/perforista/contrato, reconciliación de costos, motor de contratos con tarifas + bonos + penalizaciones, facturación y nómina auto, exports PDF/Excel/CSV.
- Mapeo geográfico live (diferenciador Sentido — ya existe en OOH).
- Roles: driller, supervisor, oficina, cliente-mina.
- Base multi-tenant desde el día 1.

**SHOULD — Fase 02 (8 semanas, $40k):**
- IA operativa consciente de pantalla (diferenciador Sentido).
- Import histórico de plataforma actual.
- Krux Scheduler-equivalente (planning con calendario).
- Hole Task Manager (tareas pre/post).
- Reportes ESG.
- Refinamiento con feedback real.

**COULD — Roadmap (Fase 03 IoT + otros):**
- IoT / KruxDAQ-equivalente.
- Survey / trayectoria del pozo.
- Core Recovery Calculator avanzado.
- Integraciones Leapfrog / IMDEX / acQuire.

**WON'T (fuera de alcance):**
- Módulo de recursos humanos completo.
- Compra de insumos / procurement.
- Seguridad industrial / permisos de trabajo formales (integrarse a lo que ya usen).

---

## 11. Siguiente paso

Con este análisis validado, procedo a:
- `02-spec-funcional.md` — spec MVP con actores, flujos, criterios de aceptación.
- `03-modelo-datos.md` — schema Postgres con las 21 entidades núcleo.
- `04-pantallas.md` — inventario de vistas (app + dashboard).
- `05-backlog.md` — tickets accionables agrupados por sprint.
