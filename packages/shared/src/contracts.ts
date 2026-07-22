// Motor de contratos (S3-BE-02/03): evaluación de condiciones, resolución de
// tarifas y simulación de DSR. Puro y sin dependencias — corre en server
// actions, en el cliente (preview) y en mobile.
//
// Dinero: los montos entran/salen como number aquí (el simulador es preview);
// la facturación real (S8) trabajará sobre numeric en SQL.

export type ConditionOp = '>=' | '>' | '<=' | '<' | '==';

/** Métricas soportadas por el condition builder (ampliable). */
export const CONDITION_METRICS = [
  'meters_period',
  'meters_month',
  'standby_hours_period',
  'downtime_unjustified_hours',
  'incidents_period',
] as const;
export type ConditionMetric = (typeof CONDITION_METRICS)[number];

export interface Condition {
  metric: ConditionMetric | string;
  op: ConditionOp;
  value: number;
}

export function isValidCondition(raw: unknown): raw is Condition {
  if (typeof raw !== 'object' || raw === null) return false;
  const c = raw as Record<string, unknown>;
  return (
    typeof c.metric === 'string' &&
    c.metric.length > 0 &&
    typeof c.value === 'number' &&
    Number.isFinite(c.value) &&
    ['>=', '>', '<=', '<', '=='].includes(String(c.op))
  );
}

/**
 * Evalúa una condición contra métricas medidas.
 * Métrica ausente ⇒ false (nunca inventar datos: sin medición no hay bono/castigo).
 */
export function evaluateCondition(
  condition: Condition,
  metrics: Record<string, number>,
): boolean {
  const measured = metrics[condition.metric];
  if (measured === undefined || !Number.isFinite(measured)) return false;

  switch (condition.op) {
    case '>=':
      return measured >= condition.value;
    case '>':
      return measured > condition.value;
    case '<=':
      return measured <= condition.value;
    case '<':
      return measured < condition.value;
    case '==':
      return measured === condition.value;
  }
}

// ── Tarifas ────────────────────────────────────────────────────────────────

export type RateType =
  | 'PER_METER'
  | 'PER_HOUR'
  | 'PER_DAY'
  | 'PER_ACTIVITY'
  | 'PER_DEPTH_TIER';

export interface RateRow {
  id: string;
  rate_type: RateType;
  activity_code: string | null;
  depth_from_m: number | null;
  depth_to_m: number | null;
  amount: number;
  currency: string;
  valid_from: string; // ISO date
  valid_to: string | null;
}

/** ¿La tarifa está vigente en la fecha dada? (rangos inclusivos) */
export function isRateActive(rate: RateRow, isoDate: string): boolean {
  if (rate.valid_from > isoDate) return false;
  if (rate.valid_to !== null && rate.valid_to < isoDate) return false;
  return true;
}

/**
 * Resuelve la tarifa aplicable. Para PER_DEPTH_TIER el intervalo es
 * [depth_from_m, depth_to_m) — depth_to_m null ⇒ sin tope.
 * Empates: gana la de valid_from más reciente (la última versión capturada).
 */
export function resolveRate(
  rates: RateRow[],
  query: {
    type: RateType;
    date: string;
    activityCode?: string | null;
    depthM?: number | null;
  },
): RateRow | null {
  const candidates = rates
    .filter((r) => r.rate_type === query.type)
    .filter((r) => isRateActive(r, query.date))
    .filter((r) =>
      r.activity_code === null ||
      r.activity_code === (query.activityCode ?? null),
    )
    .filter((r) => {
      if (query.type !== 'PER_DEPTH_TIER') return true;
      const depth = query.depthM;
      if (depth == null) return false;
      if (r.depth_from_m !== null && depth < r.depth_from_m) return false;
      if (r.depth_to_m !== null && depth >= r.depth_to_m) return false;
      return true;
    })
    .sort((a, b) => (a.valid_from < b.valid_from ? 1 : -1));

  return candidates[0] ?? null;
}

// ── Simulador de DSR (preview S3-BE-03) ────────────────────────────────────

export interface SimulationInput {
  date: string;
  metersDrilled: number;
  /** Profundidad promedio del tramo, para tiers */
  avgDepthM?: number | null;
  /** Actividades con duración, para PER_HOUR / PER_ACTIVITY */
  activities?: { code: string; durationMinutes: number }[];
}

export interface SimulationLine {
  label: string;
  rateId: string | null;
  quantity: number;
  unitAmount: number;
  amount: number;
}

export interface SimulationResult {
  lines: SimulationLine[];
  total: number;
  currency: string | null;
  warnings: string[];
}

export function simulateDsr(
  rates: RateRow[],
  input: SimulationInput,
): SimulationResult {
  const lines: SimulationLine[] = [];
  const warnings: string[] = [];
  let currency: string | null = null;

  const track = (rate: RateRow | null) => {
    if (rate && currency === null) currency = rate.currency;
    if (rate && currency !== null && rate.currency !== currency) {
      warnings.push('MIXED_CURRENCIES');
    }
  };

  // Metros: tier tiene prioridad sobre tarifa plana por metro
  if (input.metersDrilled > 0) {
    const tierRate = resolveRate(rates, {
      type: 'PER_DEPTH_TIER',
      date: input.date,
      depthM: input.avgDepthM ?? null,
    });
    const meterRate =
      tierRate ??
      resolveRate(rates, { type: 'PER_METER', date: input.date });

    if (meterRate) {
      track(meterRate);
      lines.push({
        label: tierRate ? 'METERS_TIER' : 'METERS',
        rateId: meterRate.id,
        quantity: input.metersDrilled,
        unitAmount: meterRate.amount,
        amount: round4(input.metersDrilled * meterRate.amount),
      });
    } else {
      warnings.push('NO_METER_RATE');
    }
  }

  // Actividades
  for (const activity of input.activities ?? []) {
    const perActivity = resolveRate(rates, {
      type: 'PER_ACTIVITY',
      date: input.date,
      activityCode: activity.code,
    });
    if (perActivity) {
      track(perActivity);
      lines.push({
        label: `ACTIVITY:${activity.code}`,
        rateId: perActivity.id,
        quantity: 1,
        unitAmount: perActivity.amount,
        amount: perActivity.amount,
      });
      continue;
    }
    const perHour = resolveRate(rates, {
      type: 'PER_HOUR',
      date: input.date,
      activityCode: activity.code,
    });
    if (perHour) {
      track(perHour);
      const hours = activity.durationMinutes / 60;
      lines.push({
        label: `ACTIVITY:${activity.code}`,
        rateId: perHour.id,
        quantity: round4(hours),
        unitAmount: perHour.amount,
        amount: round4(hours * perHour.amount),
      });
      continue;
    }
    warnings.push(`NO_RATE:${activity.code}`);
  }

  return {
    lines,
    total: round4(lines.reduce((sum, l) => sum + l.amount, 0)),
    currency,
    warnings,
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
