import { describe, it, expect } from 'vitest';
import { applyBar, flipPoint, realizedOutcome } from '../src/core/regate';
import type { JudgeRaw, DecisionRecord } from '../src/core/types';

const RAW_LONG: JudgeRaw = { action: 'LONG', conviction: 0.72, sizePctRaw: 4, stopPctRaw: 2.5, rationale: 'r', caseAgainst: 'bear: x' };
const RAW_NOTRADE: JudgeRaw = { action: 'NO_TRADE', conviction: 0.2, sizePctRaw: 0, stopPctRaw: 0, rationale: 'r', caseAgainst: 'bull: y' };

describe('applyBar', () => {
  it('keeps LONG + unclamped sizing when conviction clears the bar', () => {
    expect(applyBar(RAW_LONG, 0.6)).toEqual({ action: 'LONG', sizePct: 4, stopPct: 2.5 });
  });
  it('flips to NO_TRADE with zeroed sizing when the bar rises above conviction', () => {
    expect(applyBar(RAW_LONG, 0.8)).toEqual({ action: 'NO_TRADE', sizePct: 0, stopPct: 0 });
  });
  it('a native NO_TRADE never trades regardless of bar', () => {
    expect(applyBar(RAW_NOTRADE, 0).action).toBe('NO_TRADE');
  });
});

describe('flipPoint', () => {
  it('is the conviction itself (rounded) — the ruling survives down to that bar', () => {
    expect(flipPoint(RAW_LONG)).toBeCloseTo(0.72);
  });
  it('is null for a native NO_TRADE (never trades)', () => {
    expect(flipPoint(RAW_NOTRADE)).toBeNull();
  });
});

describe('realizedOutcome', () => {
  const rec = (fr?: Record<string, number | null>): DecisionRecord => ({ forwardReturns: fr } as DecisionRecord);
  it('returns the stored realized return for a covered horizon', () => {
    expect(realizedOutcome(rec({ '3': 4.2, '5': -1.1 }), 3)).toBeCloseTo(4.2);
  });
  it('returns null (honest gap) when the horizon is not covered — never interpolates', () => {
    expect(realizedOutcome(rec({ '3': 4.2 }), 10)).toBeNull();
    expect(realizedOutcome(rec(undefined), 3)).toBeNull();
    expect(realizedOutcome(rec({ '10': null }), 10)).toBeNull();
  });
});
