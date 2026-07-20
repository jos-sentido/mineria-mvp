// Tipos de dominio compartidos entre web y mobile.
// Fuente de verdad del schema: docs/03-modelo-datos.md + supabase/migrations.

export type TenantType = 'RESOURCE_OWNER' | 'SERVICE_PROVIDER' | 'INTEGRATED';

export type Role =
  | 'DRILLER'
  | 'SUPERVISOR'
  | 'SITE_COORDINATOR'
  | 'MANAGER'
  | 'ACCOUNTING'
  | 'EXTERNAL_STAKEHOLDER'
  | 'TENANT_ADMIN';

export type DsrStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'FINAL'
  | 'CANCELLED'
  | 'REJECTED'
  | 'VOIDED';

/** Dinero siempre como string decimal (numeric(18,4) en BD) — nunca float. */
export type Money = string;

export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  default_currency: string;
  default_language: 'ES' | 'EN';
  default_timezone: string;
}

// ── Datos maestros (S2) ──────────────────────────────────────────

export type SiteStatus = 'ACTIVE' | 'INACTIVE';
export type RigType = 'DIAMOND_CORE' | 'RC' | 'PERCUSSION' | 'TUNNELING' | 'OTHER';
export type RigStatus = 'OPERATIONAL' | 'MAINTENANCE' | 'INACTIVE' | 'MOVING';
export type ActivityCategory =
  | 'DRILLING'
  | 'MOVING'
  | 'STANDBY'
  | 'MAINTENANCE'
  | 'SAFETY'
  | 'OTHER';
export type ConsumableCategory =
  | 'DRILL_BIT'
  | 'LUBRICANT'
  | 'WATER'
  | 'ADDITIVE'
  | 'CEMENT'
  | 'OTHER';

export interface Site {
  id: string;
  tenant_id: string;
  region_id: string | null;
  name: string;
  code: string;
  lat: number | null;
  lng: number | null;
  altitude_m: number | null;
  timezone: string | null;
  status: SiteStatus;
}

export interface Rig {
  id: string;
  tenant_id: string;
  site_id: string | null;
  code: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  type: RigType;
  status: RigStatus;
}

export interface Driller {
  id: string;
  tenant_id: string;
  user_id: string | null;
  full_name: string;
  employee_code: string | null;
  base_rate: Money | null;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Activity {
  id: string;
  tenant_id: string;
  code: string;
  label_es: string;
  label_en: string | null;
  category: ActivityCategory;
  billable: boolean;
}

export interface Consumable {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  category: ConsumableCategory;
  unit: string;
  default_cost: Money | null;
  currency: string;
}
