import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFile } from 'node:fs/promises';
import { LLMClient } from '../src/adapters/llm/client';

describe('LLMClient noCache', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ choices: [{ message: { content: 'LIVE' } }], usage: {} }),
      { status: 200 },
    )));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('with noCache:true always calls the network even if a cache file would match', async () => {
    const llm = new LLMClient();
    const msgs = [{ role: 'user' as const, content: 'unique-nocache-probe' }];
    // First call primes the cache (default behavior).
    await llm.complete(msgs, { model: 'deepseek-v4-pro' });
    (fetch as unknown as ReturnType<typeof vi.fn>).mockClear();
    // noCache call must STILL hit the network (not replay the primed cache).
    const r = await llm.complete(msgs, { model: 'deepseek-v4-pro', noCache: true });
    expect(r.text).toBe('LIVE');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
