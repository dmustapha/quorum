import { describe, it, expect, vi, afterEach } from 'vitest';
import { runCatalystStream } from '../src/pipeline/run-stream';
import { Audit } from '../src/core/audit';
import type { CatalystEvent, StreamEvent } from '../src/core/types';

// RAMZNUSDT has committed candles in data/candles-cache (offline Collector). noCache:true on the
// run forces every LLM hit to the stubbed fetch (the committed .llm-cache would otherwise replay).
const EVENT: CatalystEvent = { symbol: 'RAMZNUSDT', eventType: 'macro', date: '2026-09-11', description: 'FOMC' };

async function collect(gen: AsyncGenerator<StreamEvent>): Promise<StreamEvent[]> {
  const out: StreamEvent[] = [];
  for await (const e of gen) out.push(e);
  return out;
}

describe('runCatalystStream', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('emits evidence → three analysts → judge → order → done, in that phase order', async () => {
    // Stub Audit.append to prevent writes to the shared evidence/live-decisions.jsonl file,
    // which races with stress-edges.test.ts's exact line-count assertion.
    vi.spyOn(Audit.prototype, 'append').mockImplementation(async (packet, transcript, verdict, orderResult) => ({
      id: 'test-live', ts: '2026-01-01T00:00:00Z', packet, transcript, verdict, orderResult,
      evidenceHash: 'test-hash',
    }) as any);

    // analysts (strong model, json) return a valid Argument; judge returns a valid verdict.
    const arg = JSON.stringify({ thesis: 't', evidenceRefs: [], confidence: 0.6 });
    const verdict = JSON.stringify({ action: 'NO_TRADE', sizePct: 0, stopPct: 0, conviction: 0.4, rationale: 'r', minorityOpinion: 'bear: x' });
    let n = 0;
    vi.stubGlobal('fetch', vi.fn(async () => {
      // first 3 calls = analysts, 4th = judge (collector uses committed candles cache, no fetch)
      const body = n++ < 3 ? arg : verdict;
      return new Response(JSON.stringify({ choices: [{ message: { content: body } }], usage: {} }), { status: 200 });
    }));
    const events = await collect(runCatalystStream(EVENT, { deadlineMs: 45_000, noCache: true }));
    const types = events.map((e) => e.type);
    expect(types[0]).toBe('evidence_ready');
    expect(new Set(types.slice(1, 4))).toEqual(new Set(['bull_done', 'bear_done', 'risk_done']));
    expect(types).toContain('judge_ruling');
    expect(types[types.length - 1]).toBe('done');
    // NO_TRADE → order is skipped, never a fabricated fill
    const order = events.find((e) => e.type === 'order_placed') as Extract<StreamEvent, { type: 'order_placed' }>;
    expect(order.orderResult.status).toBe('skipped');
  });

  it('on deadline breach yields an error event and NEVER an order or done', async () => {
    // fetch hangs UNTIL aborted — proves the deadline actually cancels the in-flight call
    // (requires Task 2's signal plumbing; a stub that ignored the signal would hang the suite).
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_res, rej) => {
      init.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')));
    })));
    const events = await collect(runCatalystStream(EVENT, { deadlineMs: 50, noCache: true }));
    const types = events.map((e) => e.type);
    expect(types).toContain('error');
    expect(types).not.toContain('order_placed');
    expect(types).not.toContain('done');
  });
});
