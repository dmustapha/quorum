// File: test/compare-resolve.test.ts
import { describe, it, expect } from 'vitest';
import { resolvePair } from '../src/core/compare-resolve';
import type { DecisionRecord } from '../src/core/types';

function makeRecord(id: string): DecisionRecord {
  return {
    id,
    ts: '2024-01-01T00:00:00Z',
    packet: {
      symbol: 'RNVDAUSDT',
      eventDate: '2024-01-01',
      eventType: 'earnings',
      priceContext: { close: 100, sma20: 100, atr14: 2, ret5d: 0.01, vol: 0.2 },
      signals: {},
      asOf: '2024-01-01T00:00:00Z',
    },
    transcript: {
      packet: {
        symbol: 'RNVDAUSDT',
        eventDate: '2024-01-01',
        eventType: 'earnings',
        priceContext: { close: 100, sma20: 100, atr14: 2, ret5d: 0.01, vol: 0.2 },
        signals: {},
        asOf: '2024-01-01T00:00:00Z',
      },
      arguments: [
        { role: 'bull', thesis: 'Bull case', evidenceRefs: [], confidence: 0.7 },
        { role: 'bear', thesis: 'Bear case', evidenceRefs: [], confidence: 0.5 },
        { role: 'risk', thesis: 'Risk case', evidenceRefs: [], confidence: 0.4 },
      ],
      rounds: 1,
    },
    verdict: {
      decision: { action: 'LONG', symbol: 'RNVDAUSDT', sizePct: 5, stopPct: 10, conviction: 0.75 },
      rationale: 'Solid setup.',
      minorityOpinion: 'Downside risk remains.',
      convictionBar: 0.6,
      judgeRaw: {
        action: 'LONG', conviction: 0.75, sizePctRaw: 5, stopPctRaw: 10,
        rationale: 'Solid setup.', caseAgainst: 'Downside risk remains.',
      },
    },
    orderResult: { status: 'filled', raw: {}, orderId: 'ORD-1' },
    evidenceHash: 'abc123',
    signalsSuppressed: false,
  };
}

const records = [makeRecord('aaa'), makeRecord('bbb'), makeRecord('ccc')];

describe('resolvePair', () => {
  it('returns both records when both ids are found', () => {
    const result = resolvePair(records, 'aaa', 'bbb');
    expect(result.a).not.toBeNull();
    expect(result.a?.id).toBe('aaa');
    expect(result.b).not.toBeNull();
    expect(result.b?.id).toBe('bbb');
  });

  it('returns null for the missing side, correct record for the other', () => {
    const result = resolvePair(records, 'aaa', 'zzz-missing');
    expect(result.a?.id).toBe('aaa');
    expect(result.b).toBeNull();

    const result2 = resolvePair(records, 'zzz-missing', 'ccc');
    expect(result2.a).toBeNull();
    expect(result2.b?.id).toBe('ccc');
  });

  it('returns both null when both ids are missing', () => {
    const result = resolvePair(records, 'x', 'y');
    expect(result.a).toBeNull();
    expect(result.b).toBeNull();
  });

  it('returns null for undefined a or b', () => {
    const result = resolvePair(records, undefined, undefined);
    expect(result.a).toBeNull();
    expect(result.b).toBeNull();

    const result2 = resolvePair(records, 'aaa', undefined);
    expect(result2.a?.id).toBe('aaa');
    expect(result2.b).toBeNull();
  });

  it('does not throw on empty records array', () => {
    expect(() => resolvePair([], 'aaa', 'bbb')).not.toThrow();
    const result = resolvePair([], 'aaa', 'bbb');
    expect(result.a).toBeNull();
    expect(result.b).toBeNull();
  });
});
