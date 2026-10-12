// Phase 1 (keep-able, client-safe — NO node/LLM imports). Pure re-gate of ONE stored ruling.
// Mirrors backtest.ts:gate() semantics but carries zero server deps so the §5.1 slider runs client-side.
import type { Action, JudgeRaw, DecisionRecord } from './types';

export function applyBar(raw: JudgeRaw, bar: number): { action: Action; sizePct: number; stopPct: number } {
  const trades = raw.action !== 'NO_TRADE' && (bar <= 0 || raw.conviction >= bar);
  return trades
    ? { action: raw.action, sizePct: raw.sizePctRaw, stopPct: raw.stopPctRaw }
    : { action: 'NO_TRADE', sizePct: 0, stopPct: 0 };
}

export function flipPoint(raw: JudgeRaw): number | null {
  if (raw.action === 'NO_TRADE') return null;
  return Math.round(raw.conviction * 100) / 100;
}

export function realizedOutcome(record: DecisionRecord, horizonDays: number): number | null {
  const v = record.forwardReturns?.[String(horizonDays)];
  return typeof v === 'number' ? v : null;
}
