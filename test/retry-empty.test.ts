import { describe, it, expect, vi, afterEach } from 'vitest';
import { completeNonEmpty, RETRY_ON_EMPTY } from '../src/adapters/llm/retry-empty';
import { LLMClient } from '../src/adapters/llm/client';

function fetchReturning(sequence: string[]) {
  let i = 0;
  return vi.fn(async () => {
    const content = sequence[Math.min(i++, sequence.length - 1)];
    return new Response(JSON.stringify({ choices: [{ message: { content } }], usage: {} }), { status: 200 });
  });
}

describe('completeNonEmpty', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('retries past empty completions and returns the first non-empty one', async () => {
    const f = fetchReturning(['', '   ', 'REAL']);
    vi.stubGlobal('fetch', f);
    const r = await completeNonEmpty(new LLMClient(), [{ role: 'user', content: 'x' }], { noCache: true }, 3);
    expect(r.text).toBe('REAL');
    expect(f).toHaveBeenCalledTimes(3); // two empties + one real
  });

  it('throws EMPTY_AFTER_RETRIES when every attempt is empty', async () => {
    vi.stubGlobal('fetch', fetchReturning(['']));
    await expect(
      completeNonEmpty(new LLMClient(), [{ role: 'user', content: 'x' }], { noCache: true }, 2),
    ).rejects.toThrow(/EMPTY_AFTER_RETRIES/);
  });

  it('defaults to RETRY_ON_EMPTY attempts', () => {
    expect(RETRY_ON_EMPTY).toBe(3);
  });

  it('propagates a thrown error (abort/transport) without retrying it as empty', async () => {
    const f = vi.fn(async () => { throw new DOMException('aborted', 'AbortError'); });
    vi.stubGlobal('fetch', f);
    await expect(
      completeNonEmpty(new LLMClient(), [{ role: 'user', content: 'x' }], { noCache: true }, 3),
    ).rejects.toThrow();
    expect(f).toHaveBeenCalledTimes(1); // fetch was called once, error thrown immediately
  });
});
