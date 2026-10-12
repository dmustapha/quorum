import { describe, it, expect, vi, afterEach } from 'vitest';
import { LLMClient } from '../src/adapters/llm/client';

describe('LLMClient abort', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('forwards opts.signal to fetch so an aborted call rejects (not hangs)', async () => {
    // fetch that respects AbortSignal: rejects when the signal aborts, else hangs.
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_res, rej) => {
      init.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')));
    })));
    const llm = new LLMClient();
    const ac = new AbortController();
    const p = llm.complete([{ role: 'user', content: 'x' }], { noCache: true, signal: ac.signal });
    ac.abort();
    await expect(p).rejects.toThrow(); // aborts promptly instead of hanging forever
  });

  it('signal does not change the cache key (replay still works without a signal)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ choices: [{ message: { content: 'HIT' } }], usage: {} }), { status: 200 })));
    const llm = new LLMClient();
    const msgs = [{ role: 'user' as const, content: 'cache-key-probe' }];
    const ac = new AbortController();
    await llm.complete(msgs, { model: 'deepseek-v4-pro' });                      // primes cache (no signal)
    (fetch as any).mockClear();
    const r = await llm.complete(msgs, { model: 'deepseek-v4-pro', signal: ac.signal }); // same key → replays
    expect(r.text).toBe('HIT');
    expect(fetch).toHaveBeenCalledTimes(0); // served from cache despite the signal
  });
});
