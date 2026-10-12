// File: test/decision-filter.test.ts
import { describe, it, expect } from 'vitest';
import { filterSort } from '../src/core/decision-filter';
import type { DecisionRecord } from '../src/core/types';

function makeRecord(overrides: {
  id: string;
  action: 'LONG' | 'SHORT' | 'NO_TRADE';
  conviction: number;
  symbol: string;
  eventDate: string;
  eventType: 'earnings' | 'macro';
}): DecisionRecord {
  return {
    id: overrides.id,
    ts: overrides.eventDate + 'T00:00:00Z',
    packet: {
      symbol: overrides.symbol,
      eventDate: overrides.eventDate,
      eventType: overrides.eventType,
      priceContext: { close: 1, sma20: 1, atr14: 0, ret5d: 0, vol: 0 },
      signals: {},
      asOf: overrides.eventDate,
    },
    transcript: {
      packet: {} as never,
      arguments: [],
      rounds: 1,
    },
    verdict: {
      decision: {
        action: overrides.action,
        symbol: overrides.symbol,
        sizePct: 0,
        stopPct: 0,
        conviction: overrides.conviction,
      },
      rationale: '',
      minorityOpinion: '',
      convictionBar: 0.6,
      judgeRaw: {
        action: overrides.action,
        conviction: overrides.conviction,
        sizePctRaw: 0,
        stopPctRaw: 0,
        rationale: '',
        caseAgainst: '',
      },
    },
    orderResult: { status: 'skipped', reason: 'NO_TRADE' },
    evidenceHash: 'abc',
    signalsSuppressed: false,
  } as DecisionRecord;
}

const r1 = makeRecord({ id: 'aaa', action: 'SHORT', conviction: 0.9, symbol: 'BTCUSDT', eventDate: '2025-01-01', eventType: 'macro' });
const r2 = makeRecord({ id: 'bbb', action: 'LONG',  conviction: 0.5, symbol: 'ETHUSDT', eventDate: '2025-01-02', eventType: 'earnings' });
const r3 = makeRecord({ id: 'ccc', action: 'SHORT', conviction: 0.7, symbol: 'SOLUSDT', eventDate: '2025-01-03', eventType: 'macro' });

describe('filterSort', () => {
  it('filters by action=SHORT', () => {
    const result = filterSort([r1, r2, r3], { action: 'SHORT', sortBy: 'date', dir: 'asc' });
    expect(result.length).toBe(2);
    expect(result.every((r) => r.verdict.decision.action === 'SHORT')).toBe(true);
  });

  it('sorts by conviction desc', () => {
    const result = filterSort([r1, r2, r3], { sortBy: 'conviction', dir: 'desc' });
    expect(result[0].verdict.decision.conviction).toBe(0.9);
    expect(result[1].verdict.decision.conviction).toBe(0.7);
    expect(result[2].verdict.decision.conviction).toBe(0.5);
  });

  it('returns [] when no records match', () => {
    const result = filterSort([r1, r2, r3], { action: 'NO_TRADE', sortBy: 'date', dir: 'asc' });
    expect(result).toEqual([]);
  });

  it('does not throw on empty input', () => {
    expect(() => filterSort([], { action: 'LONG', sortBy: 'date', dir: 'asc' })).not.toThrow();
  });

  it('does not mutate the input array', () => {
    const input = [r1, r2, r3];
    const before = [...input];
    filterSort(input, { sortBy: 'conviction', dir: 'desc' });
    expect(input).toEqual(before);
  });
});
