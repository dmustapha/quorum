// Phase 2 (pure, client-safe). Aggregates leak-safe backtest EventRows into the §5.3 scoreboard.
// Every stat carries n + drop-count. Empty buckets are null (no data), never 0%.
import type { Action } from './types';
import type { EventRow } from './backtest';

export interface Stat { value: number; n: number; dropped: number }
export interface CalibrationBucket { lo: number; hi: number; hitRate: number | null; n: number }
export interface Scoreboard {
  actionMix: { long: number; short: number; noTrade: number; n: number };
  hitRate: Stat;
  caseAgainstRight: Stat;
  panelVsAblation: { panelHitRate: number; ablationHitRate: number; panelAvgPnl: number; ablationAvgPnl: number; n: number };
  calibration: CalibrationBucket[];
  totalScored: number;
  totalDropped: number;
}

const hitRateOf = (rows: EventRow[], traded: (r: EventRow) => boolean, pnl: (r: EventRow) => number): { value: number; n: number } => {
  const t = rows.filter(traded);
  if (t.length === 0) return { value: 0, n: 0 };
  return { value: t.filter((r) => pnl(r) > 0).length / t.length, n: t.length };
};

export function calibrationBuckets(rows: EventRow[], bucketCount: number): CalibrationBucket[] {
  const traded = rows.filter((r) => r.panelTraded);
  return Array.from({ length: bucketCount }, (_, i) => {
    const lo = i / bucketCount, hi = (i + 1) / bucketCount;
    const inB = traded.filter((r) => r.panelConv >= lo && (i === bucketCount - 1 ? r.panelConv <= hi : r.panelConv < hi));
    return { lo, hi, n: inB.length, hitRate: inB.length === 0 ? null : inB.filter((r) => r.panelPnl > 0).length / inB.length };
  });
}

export function buildScoreboard(rows: EventRow[], opts: { bar: number; dropped: number }): Scoreboard {
  const panelHR = hitRateOf(rows, (r) => r.panelTraded, (r) => r.panelPnl);
  const ablHR = hitRateOf(rows, (r) => r.ablTraded, (r) => r.ablPnl);
  const tradedPanel = rows.filter((r) => r.panelTraded);
  const caseAgainst = { value: tradedPanel.length === 0 ? 0 : tradedPanel.filter((r) => r.panelPnl < 0).length / tradedPanel.length, n: tradedPanel.length };
  const count = (a: Action) => rows.filter((r) => r.panelAction === a).length;
  const avg = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((s, x) => s + x, 0) / xs.length);
  return {
    actionMix: { long: count('LONG'), short: count('SHORT'), noTrade: count('NO_TRADE'), n: rows.length },
    hitRate: { value: panelHR.value, n: panelHR.n, dropped: opts.dropped },
    caseAgainstRight: { value: caseAgainst.value, n: caseAgainst.n, dropped: opts.dropped },
    panelVsAblation: {
      panelHitRate: panelHR.value, ablationHitRate: ablHR.value,
      panelAvgPnl: avg(tradedPanel.map((r) => r.panelPnl)), ablationAvgPnl: avg(rows.filter((r) => r.ablTraded).map((r) => r.ablPnl)),
      n: rows.length,
    },
    calibration: calibrationBuckets(rows, 10),
    totalScored: rows.length,
    totalDropped: opts.dropped,
  };
}
