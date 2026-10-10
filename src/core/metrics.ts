// File: src/core/metrics.ts
// Event-study metrics over a single partition (IS or OOS). Pure, deterministic:
// same outcomes in → same ArmMetrics out. No I/O, no clock, no randomness.
import type { ArmMetrics } from './types';

export interface TradeOutcome { traded: boolean; pnlPct: number; } // pnlPct=0 if not traded

export function computeMetrics(outcomes: TradeOutcome[]): ArmMetrics {
  const trades = outcomes.filter((o) => o.traded);
  const pnls = trades.map((t) => t.pnlPct);
  const wins = pnls.filter((p) => p > 0).length;
  const avg = pnls.length ? pnls.reduce((s, p) => s + p, 0) / pnls.length : 0;
  // population stdev (Rf=0, NOT annualized) — defined so a judge can reproduce it from rows.
  const sd = pnls.length ? Math.sqrt(pnls.reduce((s, p) => s + (p - avg) ** 2, 0) / pnls.length) : 0;
  // equity path for drawdown
  let eq = 1, peak = 1, maxDd = 0;
  for (const p of pnls) { eq *= 1 + p / 100; peak = Math.max(peak, eq); maxDd = Math.max(maxDd, (peak - eq) / peak); }
  return {
    events: outcomes.length, trades: trades.length,
    hitRate: trades.length ? wins / trades.length : 0,
    avgPnlPct: avg, sharpeLike: sd ? avg / sd : 0, maxDrawdownPct: maxDd * 100,
  };
}
