# Modelo de datos — Plataforma perforación

**Base de datos:** PostgreSQL 15+ (Supabase managed — decidido en setup, sustituye el plan original de Digital Ocean)
**Multi-tenancy:** columna `tenant_id` en toda tabla operativa + Row Level Security (RLS)
**Convenciones:**
- PKs: `uuid` v4 (client-generable para sync offline).
- Timestamps: `created_at`, `updated_at` con default `now()`, `deleted_at` para soft delete.
- Dinero: `numeric(18,4)`. Nunca float.
- Enums: PostgreSQL `enum` types (no strings libres).
- FK: `on delete restrict` por default, salvo audit y logs (`cascade`).

---

## 1. Módulo TENANT / usuarios

### 1.1 `tenants`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| name | text | Ej. "Minera Zacatecas SA" |
| type | enum tenant_type | RESOURCE_OWNER, SERVICE_PROVIDER, INTEGRATED |
| default_currency | char(3) | ISO 4217 (MXN, USD, CAD) |
| default_language | char(2) | ES, EN |
| default_timezone | text | ej. "America/Mexico_City" |
| plan | enum plan_type | MVP, PRO, ENTERPRISE (para futuro) |
| status | enum tenant_status | ACTIVE, SUSPENDED, ARCHIVED |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 1.2 `users`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK → tenants | |
| email | citext unique per tenant | |
| password_hash | text | bcrypt cost 12 |
| full_name | text | |
| language | char(2) | override sobre tenant default |
| phone | text | para push/SMS |
| avatar_url | text | S3 |
| status | enum user_status | ACTIVE, INVITED, DISABLED |
| last_login_at | timestamptz | |
| mfa_enabled | bool | default false |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 1.3 `roles`
Fijo, no CRUD:
- `DRILLER`
- `SUPERVISOR`
- `SITE_COORDINATOR`
- `MANAGER`
- `ACCOUNTING`
- `EXTERNAL_STAKEHOLDER`
- `TENANT_ADMIN`

### 1.4 `user_roles`
| Columna | Tipo | Notas |
|---|---|---|
| user_id | uuid FK | |
| role | enum role | |
| scope_type | enum scope | GLOBAL, SITE, RIG, CONTRACT |
| scope_id | uuid | null si GLOBAL |
| PK compuesto | (user_id, role, scope_type, scope_id) | |

Permite que un mismo usuario sea `SUPERVISOR` en Sitio A y `SITE_COORDINATOR` en Sitio B.

### 1.5 `audit_log`
| Columna | Tipo | Notas |
|---|---|---|
| id | bigserial PK | |
| tenant_id | uuid | |
| actor_user_id | uuid | null si sistema |
| action | text | ej. "dsr.approved", "contract.rate_updated" |
| entity_type | text | ej. "dsr" |
| entity_id | uuid | |
| before | jsonb | snapshot pre-cambio |
| after | jsonb | snapshot post-cambio |
| ip_address | inet | |
| user_agent | text | |
| created_at | timestamptz | index brin |

Append-only. No deletes.

---

## 2. Módulo GEOGRAFÍA / ORGANIZACIÓN

### 2.1 `regions`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| name | text | "Zacatecas", "Sonora" |
| country | char(2) | ISO 3166 |
| timezone | text | |

### 2.2 `sites` (minas)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| region_id | uuid FK → regions | |
| name | text | |
| code | text | slug interno |
| location | geography(POINT,4326) | PostGIS — para mapa |
| altitude_m | int | |
| timezone | text | override region |
| status | enum site_status | ACTIVE, INACTIVE |
| metadata | jsonb | campos custom por tenant |

### 2.3 `rigs` (máquinas de perforación)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| site_id | uuid FK → sites | rig actual |
| code | text | ej. "RIG-07" |
| brand | text | |
| model | text | |
| serial_number | text | |
| type | enum rig_type | DIAMOND_CORE, RC, PERCUSSION, TUNNELING, OTHER |
| owner_org | uuid | tenant_id o subcontratista si aplica |
| status | enum rig_status | OPERATIONAL, MAINTENANCE, INACTIVE, MOVING |
| current_location | geography(POINT,4326) | para mapa live |
| last_location_at | timestamptz | |
| metadata | jsonb | horas totales, calibraciones |

---

## 3. Módulo PERSONAS OPERATIVAS

### 3.1 `drillers` (perfil operativo)
Perforista puede existir como record sin ser `user` (contratistas). Si es empleado, se enlaza a `users`.

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| user_id | uuid FK → users | nullable |
| full_name | text | |
| employee_code | text | |
| certifications | jsonb | ej. [{code:"OPT-1", expires:"2027-05-01"}] |
| base_rate | numeric(18,4) | por hora o por turno según contrato |
| currency | char(3) | |
| status | enum | ACTIVE, INACTIVE |

### 3.2 `crews` (cuadrillas)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| name | text | |
| rig_id | uuid FK → rigs | rig asignado por default |
| lead_driller_id | uuid FK → drillers | |

### 3.3 `crew_members`
| Columna | Tipo | Notas |
|---|---|---|
| crew_id | uuid | |
| driller_id | uuid | |
| role_in_crew | text | "driller", "helper", "supervisor" |
| PK compuesto | (crew_id, driller_id) | |

### 3.4 `shifts` (turnos)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| rig_id | uuid FK → rigs | |
| crew_id | uuid FK → crews | nullable |
| shift_date | date | |
| shift_type | enum shift_type | DAY, NIGHT, SWING, CUSTOM |
| planned_start | timestamptz | |
| planned_end | timestamptz | |
| actual_start | timestamptz | |
| actual_end | timestamptz | |
| supervisor_driller_id | uuid FK | |

---

## 4. Módulo CONTRATOS / TARIFAS

### 4.1 `contracts`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| code | text | ej. "CTR-2026-Z01" |
| name | text | descripción |
| provider_org_id | uuid | el que perfora |
| client_org_id | uuid | el que paga |
| currency | char(3) | |
| status | enum contract_status | DRAFT, ACTIVE, SUSPENDED, IN_BILLING, CLOSED |
| starts_at | date | |
| ends_at | date | |
| billing_cycle | enum billing_cycle | WEEKLY, BIWEEKLY, MONTHLY, CUSTOM |
| po_number | text | orden de compra base |
| notes | text | |

### 4.2 `contract_rigs`
Rigs cubiertos por el contrato.
| contract_id | uuid |
| rig_id | uuid |
| PK compuesto | (contract_id, rig_id) |

### 4.3 `contract_sites`
| contract_id | uuid |
| site_id | uuid |
| PK compuesto | (contract_id, site_id) |

### 4.4 `contract_rates` (tarifas)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| contract_id | uuid FK | |
| rate_type | enum rate_type | PER_METER, PER_HOUR, PER_DAY, PER_ACTIVITY, PER_DEPTH_TIER |
| activity_code | text | ej. "DRILL_ROCK_HARD", "STANDBY_LOGISTIC" — nullable si aplica siempre |
| depth_from_m | int | nullable — para tier |
| depth_to_m | int | nullable |
| amount | numeric(18,4) | |
| currency | char(3) | |
| valid_from | date | |
| valid_to | date | nullable |
| created_by | uuid | |
| created_at | timestamptz | |

Historial completo — al editar se crea nuevo row, no se muta.

### 4.5 `contract_bonuses`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| contract_id | uuid FK | |
| bonus_type | enum bonus_type | GOAL_ACHIEVED, SAFETY, EFFICIENCY, EARLY_COMPLETION |
| condition | jsonb | ej. `{metric:"meters_month", op:">=", value:5000}` |
| amount | numeric(18,4) | |
| amount_type | enum | FIXED, PERCENTAGE |
| valid_from | date | |
| valid_to | date | |

### 4.6 `contract_penalties`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| contract_id | uuid FK | |
| penalty_type | enum penalty_type | STANDBY_EXCEED, INCIDENT, DELAY, QUALITY |
| condition | jsonb | |
| amount | numeric(18,4) | |
| amount_type | enum | FIXED, PERCENTAGE |
| valid_from | date | |
| valid_to | date | |

### 4.7 `contract_milestones` (hitos de pago por profundidad)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| contract_id | uuid FK | |
| trigger | enum milestone_trigger | DEPTH_REACHED, HOLE_COMPLETED, DATE_REACHED |
| trigger_value | jsonb | |
| amount | numeric(18,4) | |

---

## 5. Módulo PROGRAMA / POZOS

### 5.1 `programs` (campañas)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| site_id | uuid FK | |
| contract_id | uuid FK | nullable |
| name | text | |
| planned_start | date | |
| planned_end | date | |
| target_meters | int | |
| status | enum program_status | PLANNED, IN_PROGRESS, COMPLETED, CANCELLED |

### 5.2 `holes` (pozos)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| program_id | uuid FK | nullable si es standalone |
| site_id | uuid FK | |
| code | text | ej. "PZ-024" |
| planned_azimuth | numeric(6,2) | grados |
| planned_dip | numeric(6,2) | grados (- hacia abajo) |
| planned_depth_m | int | |
| collar_location | geography(POINT,4326) | |
| status | enum hole_status | PLANNED, PRE_DRILLING, DRILLING, POST_DRILLING, COMPLETED, SUSPENDED, ABANDONED |
| assigned_rig_id | uuid FK | |
| started_at | timestamptz | |
| completed_at | timestamptz | |
| actual_depth_m | numeric(10,2) | |
| notes | text | |

### 5.3 `hole_survey_points` (trayectoria)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| hole_id | uuid FK | |
| depth_m | numeric(10,2) | |
| azimuth | numeric(6,2) | |
| dip | numeric(6,2) | |
| survey_method | text | ej. "gyroscopic", "single-shot" |
| measured_at | timestamptz | |
| source | enum survey_source | MANUAL, IMPORT_CSV, IMDEX_API |
| notes | text | |

### 5.4 `hole_tasks` (task manager pre/post)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| hole_id | uuid FK | |
| phase | enum task_phase | PRE, POST |
| code | text | del catálogo tenant |
| title | text | |
| required | bool | bloquea cambio de estado si no completada |
| assignee_user_id | uuid | |
| due_date | date | |
| status | enum task_status | PENDING, IN_PROGRESS, COMPLETED, SKIPPED |
| completed_at | timestamptz | |
| completed_by | uuid | |
| evidence_urls | text[] | S3 |
| notes | text | |

### 5.5 `hole_task_templates` (config por tenant)
Checklist reutilizable a nivel tenant. Instanciada por hole al crearse.

---

## 6. Módulo DSR (reporte diario/turno)

### 6.1 `dsrs`
El corazón del sistema.
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | client-generable |
| tenant_id | uuid FK | |
| shift_id | uuid FK → shifts | |
| hole_id | uuid FK → holes | nullable si no vinculado a pozo |
| rig_id | uuid FK → rigs | |
| primary_driller_id | uuid FK → drillers | |
| supervisor_id | uuid FK → drillers | quien aprueba |
| contract_id | uuid FK → contracts | snapshot al crear |
| po_number | text | override contrato si aplica |
| depth_start_m | numeric(10,2) | inicio del turno |
| depth_end_m | numeric(10,2) | fin del turno |
| meters_drilled | numeric(10,2) | computed pero guardado |
| shift_date | date | denorm para query rápida |
| status | enum dsr_status | DRAFT, IN_REVIEW, APPROVED, FINAL, CANCELLED, REJECTED, VOIDED |
| voided_by_dsr_id | uuid | si se anuló, apunta al reemplazo |
| driller_signature | text | b64 hash + timestamp |
| supervisor_signature | text | |
| approved_at | timestamptz | |
| finalized_at | timestamptz | |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| synced_from_device_id | text | para trazabilidad offline |

### 6.2 `dsr_activities` (líneas de actividad del turno)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| dsr_id | uuid FK cascade | |
| sequence | int | orden |
| activity_code | text | del catálogo `activities` |
| category | enum activity_category | DRILLING, MOVING, STANDBY, MAINTENANCE, SAFETY, OTHER |
| duration_minutes | int | |
| depth_from_m | numeric(10,2) | nullable |
| depth_to_m | numeric(10,2) | nullable |
| notes | text | |

### 6.3 `activities` (catálogo por tenant)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| code | text unique per tenant | |
| label_es | text | |
| label_en | text | |
| category | enum activity_category | |
| billable | bool | |

### 6.4 `dsr_consumables`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| dsr_id | uuid FK cascade | |
| consumable_id | uuid FK → consumables | |
| quantity | numeric(12,2) | |
| unit | text | ej. "pcs", "L", "kg" |
| unit_cost | numeric(18,4) | snapshot |
| total_cost | numeric(18,4) | computed |

### 6.5 `consumables` (catálogo)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| code | text | |
| name | text | |
| category | enum consumable_category | DRILL_BIT, LUBRICANT, WATER, ADDITIVE, CEMENT, OTHER |
| unit | text | |
| default_cost | numeric(18,4) | |
| currency | char(3) | |

### 6.6 `contract_consumables` (filtro por contrato)
Qué consumibles ve el perforista según contrato activo.
| contract_id | uuid |
| consumable_id | uuid |
| custom_cost | numeric(18,4) | nullable, override |
| PK | (contract_id, consumable_id) |

### 6.7 `dsr_downtimes` (paros)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| dsr_id | uuid FK cascade | |
| downtime_code | text | catálogo tenant |
| category | enum downtime_category | MECHANICAL, LOGISTIC, HUMAN, WEATHER, POWER, SAFETY, OTHER |
| duration_minutes | int | |
| justified | bool | |
| justification_text | text | obligatorio si `justified=false` para dispararse penalización |
| root_cause_hint | text | IA F2 rellena esto |

### 6.8 `dsr_timesheet` (horas-hombre)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| dsr_id | uuid FK cascade | |
| driller_id | uuid FK | |
| hours_worked | numeric(5,2) | |
| hours_overtime | numeric(5,2) | |
| notes | text | |

### 6.9 `dsr_core_recovery`
| Columna | Tipo | Notas |
|---|---|---|
| dsr_id | uuid FK PK | |
| interval_start_m | numeric(10,2) | |
| interval_end_m | numeric(10,2) | |
| core_recovered_m | numeric(10,2) | |
| recovery_pct | numeric(5,2) | computed |
| rqd_pct | numeric(5,2) | Rock Quality Designation |
| calc_config_snapshot | jsonb | config equipo al momento |

### 6.10 `dsr_incidents`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| dsr_id | uuid FK | |
| type | enum incident_type | INJURY, EQUIPMENT_DAMAGE, ENV_SPILL, NEAR_MISS, OTHER |
| severity | enum severity | LOW, MEDIUM, HIGH, CRITICAL |
| description | text | |
| reported_by | uuid | |
| evidence_urls | text[] | |

### 6.11 `dsr_approvals` (auditoría de flujo)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| dsr_id | uuid FK | |
| step | enum approval_step | DRILLER_SUBMIT, SUPERVISOR_APPROVE, SUPERVISOR_REJECT, OFFICE_FINALIZE, OFFICE_REQUEST_FIX, VOID |
| actor_user_id | uuid | |
| comment | text | |
| created_at | timestamptz | |

---

## 7. Módulo FACTURACIÓN / NÓMINA

### 7.1 `billing_periods`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| contract_id | uuid FK | |
| period_start | date | |
| period_end | date | |
| status | enum billing_status | OPEN, CLOSING, CLOSED, INVOICED, PAID |
| closed_at | timestamptz | |
| closed_by | uuid | |

### 7.2 `invoices`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| billing_period_id | uuid FK | |
| contract_id | uuid FK | |
| invoice_number | text | correlativo |
| issued_at | date | |
| currency | char(3) | |
| subtotal | numeric(18,4) | |
| taxes | numeric(18,4) | |
| total | numeric(18,4) | |
| status | enum invoice_status | DRAFT, ISSUED, PAID, CANCELLED |
| pdf_url | text | |
| paid_at | date | |

### 7.3 `invoice_lines`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| invoice_id | uuid FK cascade | |
| source_dsr_id | uuid FK | trazabilidad |
| line_type | enum line_type | METERS_DRILLED, ACTIVITY, CONSUMABLE, BONUS, PENALTY, ADDITIONAL_CHARGE, RENTAL, MILESTONE |
| description | text | |
| quantity | numeric(12,2) | |
| unit_price | numeric(18,4) | |
| amount | numeric(18,4) | |

### 7.4 `payroll_runs` (corrida de nómina)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| period_start | date | |
| period_end | date | |
| status | enum payroll_status | OPEN, CLOSED, PAID |

### 7.5 `payroll_lines`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| payroll_run_id | uuid FK | |
| driller_id | uuid FK | |
| source_dsr_ids | uuid[] | |
| base_amount | numeric(18,4) | |
| bonus_amount | numeric(18,4) | |
| deduction_amount | numeric(18,4) | |
| total_amount | numeric(18,4) | |
| notes | text | |

### 7.6 `additional_charges` (cargos extra fuera de DSR)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| contract_id | uuid FK | |
| description | text | |
| amount | numeric(18,4) | |
| currency | char(3) | |
| billable | bool | |
| applied_at | date | |
| evidence_urls | text[] | |
| created_by | uuid | |

### 7.7 `rentals` (equipos rentados)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| contract_id | uuid FK | |
| equipment_name | text | |
| daily_rate | numeric(18,4) | |
| currency | char(3) | |
| rented_from | date | |
| rented_to | date | |

---

## 8. Módulo REPORTES / EXPORTS

### 8.1 `report_templates`
| id | uuid PK |
| tenant_id | uuid |
| name | text |
| kind | enum report_kind | OPERATIONAL, FINANCIAL, ESG, CONTRACT, CUSTOM |
| format | enum report_format | PDF, XLSX, CSV |
| config | jsonb | secciones, filtros, columnas |
| created_by | uuid |

### 8.2 `report_runs` (histórico de ejecuciones)
| id | uuid PK |
| template_id | uuid |
| params | jsonb |
| output_url | text | S3 |
| status | enum run_status | RUNNING, COMPLETED, FAILED |
| ran_by | uuid |
| ran_at | timestamptz |

---

## 9. Módulo IA (F2, esquema listo desde MVP)

### 9.1 `ai_conversations`
| id | uuid PK |
| user_id | uuid |
| context | jsonb | pantalla actual, filtros |
| created_at | timestamptz |

### 9.2 `ai_messages`
| id | uuid PK |
| conversation_id | uuid |
| role | enum msg_role | USER, ASSISTANT, SYSTEM |
| content | text |
| citations | jsonb | filas/agregados consultados |
| tokens_used | int |
| model | text |
| created_at | timestamptz |

### 9.3 `ai_alerts` (alertas proactivas)
| id | uuid PK |
| tenant_id | uuid |
| kind | enum alert_kind | CONTRACT_DEVIATION, UNJUSTIFIED_DOWNTIME, PERFORMANCE_ANOMALY, SAFETY_TREND |
| severity | enum severity | INFO, WARNING, CRITICAL |
| entity_ref | jsonb | ej. `{contract_id: "..."}` |
| explanation | text |
| ack_by | uuid |
| ack_at | timestamptz |
| created_at | timestamptz |

---

## 10. Módulo SYNC OFFLINE (metadata cliente)

### 10.1 `sync_events` (server-side log de sync)
| id | bigserial PK |
| device_id | text |
| user_id | uuid |
| entity_type | text |
| entity_id | uuid |
| operation | enum | CREATE, UPDATE, DELETE |
| client_timestamp | timestamptz |
| server_received_at | timestamptz |
| conflict_resolved | bool |
| resolution_strategy | enum | LAST_WRITE_WINS, SERVER_WINS, MANUAL |

---

## 11. Índices críticos

```sql
-- DSR queries frecuentes
CREATE INDEX idx_dsrs_tenant_shift_date ON dsrs (tenant_id, shift_date DESC);
CREATE INDEX idx_dsrs_status ON dsrs (tenant_id, status) WHERE status IN ('IN_REVIEW','APPROVED');
CREATE INDEX idx_dsrs_hole ON dsrs (hole_id, shift_date);
CREATE INDEX idx_dsrs_rig ON dsrs (rig_id, shift_date DESC);
CREATE INDEX idx_dsrs_contract ON dsrs (contract_id, shift_date);

-- Actividades / consumibles por DSR (join constante)
CREATE INDEX idx_dsr_activities_dsr ON dsr_activities (dsr_id);
CREATE INDEX idx_dsr_consumables_dsr ON dsr_consumables (dsr_id);

-- Facturación
CREATE INDEX idx_invoice_lines_invoice ON invoice_lines (invoice_id);
CREATE INDEX idx_invoice_lines_source_dsr ON invoice_lines (source_dsr_id);

-- Mapa / geo
CREATE INDEX idx_rigs_current_loc ON rigs USING gist (current_location);
CREATE INDEX idx_sites_location ON sites USING gist (location);
CREATE INDEX idx_holes_collar ON holes USING gist (collar_location);

-- Audit / sync (append-heavy)
CREATE INDEX idx_audit_created ON audit_log USING brin (created_at);
CREATE INDEX idx_sync_events_device ON sync_events (device_id, client_timestamp);
```

---

## 12. Row Level Security (RLS)

Ejemplo para `dsrs`:

```sql
ALTER TABLE dsrs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON dsrs
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY driller_own_shift ON dsrs
  FOR SELECT
  USING (
    current_setting('app.current_role') = 'DRILLER'
    AND primary_driller_id = (
      SELECT id FROM drillers WHERE user_id = current_setting('app.current_user')::uuid
    )
  );
```

Se aplica el mismo patrón a todas las tablas operativas.

---

## 13. Diagrama de relaciones (alto nivel)

```
tenant ─┬── users ─── user_roles
        ├── sites ─── rigs
        │      └── holes ── programs
        │            ├── hole_survey_points
        │            └── hole_tasks
        ├── drillers ─── crews ─── shifts
        ├── contracts ─┬── contract_rates
        │              ├── contract_bonuses
        │              ├── contract_penalties
        │              ├── contract_milestones
        │              ├── contract_rigs
        │              ├── contract_sites
        │              └── contract_consumables
        ├── consumables
        ├── activities
        └── dsrs (CORE) ─┬── dsr_activities
                         ├── dsr_consumables
                         ├── dsr_downtimes
                         ├── dsr_timesheet
                         ├── dsr_core_recovery
                         ├── dsr_incidents
                         └── dsr_approvals

dsrs → invoice_lines → invoices → billing_periods
dsrs → payroll_lines → payroll_runs
```

---

## 14. Estimación de volumen y crecimiento (para dimensionar BD)

Asumiendo minera mediana:
- 10 rigs × 2 turnos/día × 365 = **7,300 DSRs/año**
- Cada DSR ~ 10 activities + 5 consumibles + 2 downtimes = **~120k filas hijas/año**
- Audit log ~ 50k eventos/mes = **600k/año**

Supabase plan Pro (8GB de BD incluidos, escalable) alcanza cómodo 3-5 años.
Al año 3 evaluar upgrade y particionamiento por año en `dsrs` y `audit_log`.

---

## 15. Migración de data histórica [F2]

Estrategia:
1. Cliente exporta CSV/Excel del sistema actual.
2. Sentido escribe scripts idempotentes por entidad (holes → dsrs → consumables → invoices).
3. Validación cruzada: totales de facturación histórica ± 0.1%.
4. Data migrada marcada con `source='LEGACY_IMPORT'` en metadata para trazabilidad.

---

## 16. Referencias

- Spec funcional → `02-spec-funcional.md`
- Pantallas que consumen este modelo → `04-pantallas.md`
- Tickets para implementar migraciones → `05-backlog.md`
