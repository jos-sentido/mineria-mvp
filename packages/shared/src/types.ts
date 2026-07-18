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
