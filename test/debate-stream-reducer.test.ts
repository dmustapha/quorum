import { describe, it, expect } from 'vitest';
import { reduceStream, initialStreamState } from '../src/app/_components/stream-reducer';
import type { StreamEvent } from '../src/core/types';

const arg = (role: 'bull'|'bear'|'risk') => ({ role, thesis: `${role} says`, evidenceRefs: [], confidence: 0.6 });

describe('reduceStream', () => {
  it('accumulates analyst args by role and marks the judge ruling live-but-unvalidated', () => {
    let s = initialStreamState();
    for (const ev of [
      { type: 'evidence_ready', packet: {} } as unknown as StreamEvent,
      { type: 'bull_done', arg: arg('bull') },
      { type: 'risk_done', arg: arg('risk') },
    ] as StreamEvent[]) s = reduceStream(s, ev);
    expect(s.args.bull?.thesis).toBe('bull says');
    expect(s.args.risk?.thesis).toBe('risk says');
    expect(s.args.bear).toBeUndefined();
    expect(s.phase).toBe('debating');
  });

  it('error event moves phase to failed and records the message', () => {
    let s = initialStreamState();
    s = reduceStream(s, { type: 'error', stage: 'judge', message: 'the panel could not reach a reading' });
    expect(s.phase).toBe('failed');
    expect(s.error).toMatch(/could not reach/);
  });

  it('done event captures the record and marks complete', () => {
    let s = initialStreamState();
    s = reduceStream(s, { type: 'done', record: { id: 'live-x' } as any });
    expect(s.phase).toBe('done');
    expect(s.record?.id).toBe('live-x');
  });
});
