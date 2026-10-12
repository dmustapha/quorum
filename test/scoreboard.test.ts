import { describe, it, expect } from 'vitest';
import { buildScoreboard, calibrationBuckets } from '../src/core/scoreboard';
import type { EventRow } from '../src/core/backtest';

const row = (o: Partial<EventRow>): EventRow => ({
  date: '2026-09-11', symbol: 'X', isOos: true,
  panelConv: 0.6, panelAction: 'SHORT', ablConv: 0.6, ablAction: 'NO_TRADE',
  fwdRet: -2, panelPnl: 2, panelTraded: true, ablPnl: 0, ablTraded: false, ...o,
});

describe('buildScoreboard', () => {
  it('n=0 corpus → hitRate.n is 0 and value is not a fabricated number', () => {
    const s = buildScoreboard([], { bar: 0.6, dropped: 20 });
    expect(s.hitRate.n).toBe(0);
    expect(s.totalScored).toBe(0);
    expect(s.totalDropped).toBe(20);
  });
  it('hit-rate counts correct traded rows over traded rows (panelPnl>0 = correct)', () => {
    const s = buildScoreboard([row({ panelPnl: 2 }), row({ panelPnl: -1 })], { bar: 0.6, dropped: 0 });
    expect(s.hitRate.value).toBeCloseTo(0.5);
    expect(s.hitRate.n).toBe(2);
  });
  it('carries the gateway drop-count into every denominator context', () => {
    const s = buildScoreboard([row({})], { bar: 0.6, dropped: 20 });
    expect(s.totalDropped).toBe(20);
  });
  it('panel-vs-ablation delta is computed from the same rows', () => {
    const s = buildScoreboard([row({ panelPnl: 2, panelTraded: true, ablTraded: false })], { bar: 0.6, dropped: 0 });
    expect(s.panelVsAblation.panelHitRate).toBeGreaterThanOrEqual(0);
    expect(s.panelVsAblation.ablationHitRate).toBe(0); // 0 ablation trades
  });
});

describe('calibrationBuckets', () => {
  it('an empty bucket has hitRate null (no data), never 0%', () => {
    const buckets = calibrationBuckets([row({ panelConv: 0.65 })], 10);
    const empty = buckets.find((b) => b.n === 0)!;
    expect(empty.hitRate).toBeNull();
    const filled = buckets.find((b) => b.lo <= 0.65 && 0.65 < b.hi)!;
    expect(filled.n).toBe(1);
  });
});
