import { describe, expect, it } from 'vitest';
import {
  evaluateCondition,
  isRateActive,
  isValidCondition,
  resolveRate,
  simulateDsr,
  type RateRow,
} from './contracts';

const rate = (partial: Partial<RateRow>): RateRow => ({
  id: 'r1',
  rate_type: 'PER_METER',
  activity_code: null,
  depth_from_m: null,
  depth_to_m: null,
  amount: 100,
  currency: 'MXN',
  valid_from: '2026-01-01',
  valid_to: null,
  ...partial,
});

describe('evaluateCondition', () => {
  it('evalúa cada operador', () => {
    const metrics = { meters_month: 5000 };
    expect(evaluateCondition({ metric: 'meters_month', op: '>=', value: 5000 }, metrics)).toBe(true);
    expect(evaluateCondition({ metric: 'meters_month', op: '>', value: 5000 }, metrics)).toBe(false);
    expect(evaluateCondition({ metric: 'meters_month', op: '<=', value: 4999 }, metrics)).toBe(false);
    expect(evaluateCondition({ metric: 'meters_month', op: '<', value: 5001 }, metrics)).toBe(true);
    expect(evaluateCondition({ metric: 'meters_month', op: '==', value: 5000 }, metrics)).toBe(true);
  });

  it('métrica ausente nunca dispara la condición', () => {
    expect(evaluateCondition({ metric: 'standby_hours_period', op: '>=', value: 0 }, {})).toBe(false);
  });

  it('valida el shape del JSON', () => {
    expect(isValidCondition({ metric: 'meters_month', op: '>=', value: 10 })).toBe(true);
    expect(isValidCondition({ metric: '', op: '>=', value: 10 })).toBe(false);
    expect(isValidCondition({ metric: 'x', op: '~', value: 10 })).toBe(false);
    expect(isValidCondition({ metric: 'x', op: '>=', value: NaN })).toBe(false);
    expect(isValidCondition(null)).toBe(false);
  });
});

describe('isRateActive / resolveRate', () => {
  it('respeta rangos de vigencia inclusivos', () => {
    const r = rate({ valid_from: '2026-02-01', valid_to: '2026-02-28' });
    expect(isRateActive(r, '2026-01-31')).toBe(false);
    expect(isRateActive(r, '2026-02-01')).toBe(true);
    expect(isRateActive(r, '2026-02-28')).toBe(true);
    expect(isRateActive(r, '2026-03-01')).toBe(false);
  });

  it('al haber versiones, gana la de valid_from más reciente', () => {
    const rates = [
      rate({ id: 'old', amount: 100, valid_from: '2026-01-01' }),
      rate({ id: 'new', amount: 120, valid_from: '2026-03-01' }),
    ];
    expect(resolveRate(rates, { type: 'PER_METER', date: '2026-04-01' })?.id).toBe('new');
    expect(resolveRate(rates, { type: 'PER_METER', date: '2026-02-01' })?.id).toBe('old');
  });

  it('tarifa por actividad específica no aplica a otras actividades', () => {
    const rates = [
      rate({ id: 'a', rate_type: 'PER_HOUR', activity_code: 'STANDBY_CLIENT', amount: 900 }),
    ];
    expect(
      resolveRate(rates, { type: 'PER_HOUR', date: '2026-06-01', activityCode: 'STANDBY_CLIENT' })?.id,
    ).toBe('a');
    expect(
      resolveRate(rates, { type: 'PER_HOUR', date: '2026-06-01', activityCode: 'DRILL' }),
    ).toBeNull();
  });

  it('tiers de profundidad: intervalo [from, to) y null = sin tope', () => {
    const rates = [
      rate({ id: 't1', rate_type: 'PER_DEPTH_TIER', depth_from_m: 0, depth_to_m: 300, amount: 1000 }),
      rate({ id: 't2', rate_type: 'PER_DEPTH_TIER', depth_from_m: 300, depth_to_m: null, amount: 1400 }),
    ];
    expect(resolveRate(rates, { type: 'PER_DEPTH_TIER', date: '2026-06-01', depthM: 299 })?.id).toBe('t1');
    expect(resolveRate(rates, { type: 'PER_DEPTH_TIER', date: '2026-06-01', depthM: 300 })?.id).toBe('t2');
    expect(resolveRate(rates, { type: 'PER_DEPTH_TIER', date: '2026-06-01', depthM: 9000 })?.id).toBe('t2');
    expect(resolveRate(rates, { type: 'PER_DEPTH_TIER', date: '2026-06-01' })).toBeNull();
  });
});

describe('simulateDsr', () => {
  const rates: RateRow[] = [
    rate({ id: 'm', rate_type: 'PER_METER', amount: 1200 }),
    rate({ id: 't-deep', rate_type: 'PER_DEPTH_TIER', depth_from_m: 300, depth_to_m: null, amount: 1500 }),
    rate({ id: 'standby', rate_type: 'PER_HOUR', activity_code: 'STANDBY_CLIENT', amount: 800 }),
    rate({ id: 'move', rate_type: 'PER_ACTIVITY', activity_code: 'RIG_MOVE', amount: 25000 }),
  ];

  it('metros × tarifa plana', () => {
    const result = simulateDsr(rates, { date: '2026-06-01', metersDrilled: 12.5 });
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].amount).toBe(15000);
    expect(result.total).toBe(15000);
    expect(result.currency).toBe('MXN');
  });

  it('el tier de profundidad tiene prioridad sobre la tarifa plana', () => {
    const result = simulateDsr(rates, { date: '2026-06-01', metersDrilled: 10, avgDepthM: 450 });
    expect(result.lines[0].label).toBe('METERS_TIER');
    expect(result.lines[0].unitAmount).toBe(1500);
    expect(result.total).toBe(15000);
  });

  it('actividades por hora y por evento; sin tarifa ⇒ warning, nunca inventa monto', () => {
    const result = simulateDsr(rates, {
      date: '2026-06-01',
      metersDrilled: 0,
      activities: [
        { code: 'STANDBY_CLIENT', durationMinutes: 90 },
        { code: 'RIG_MOVE', durationMinutes: 240 },
        { code: 'SIN_TARIFA', durationMinutes: 60 },
      ],
    });
    expect(result.lines).toHaveLength(2);
    expect(result.total).toBe(800 * 1.5 + 25000);
    expect(result.warnings).toContain('NO_RATE:SIN_TARIFA');
  });

  it('sin tarifa de metros ⇒ warning y total 0', () => {
    const result = simulateDsr([], { date: '2026-06-01', metersDrilled: 100 });
    expect(result.total).toBe(0);
    expect(result.warnings).toContain('NO_METER_RATE');
  });
});
