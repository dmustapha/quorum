// File: src/adapters/llm/client.ts
// OpenAI-compatible chat completions (Qwen/Kimi K3 via sponsor endpoint) with an on-disk
// prompt-hash cache for determinism + cost control.
//
// DETERMINISM NOTE (relevant to P2 backtest):
//   The cache keys on (model, messages, opts). A cache HIT is fully deterministic — the same
//   inputs replay the same bytes, never touching the network. A cache MISS with temperature>0
//   is NON-deterministic: two misses on the same key may differ. Backtests must therefore run
//   once to populate the cache, after which repeats reproduce exactly. (INVARIANT: escalate,
//   don't fabricate — on repeated network failure we THROW, never synthesize a response.)

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CACHE_DIR = path.join(process.cwd(), '.llm-cache');

export interface LLMMessage { role: 'system' | 'user' | 'assistant'; content: string; }
export interface CompleteOpts { model?: string; json?: boolean; temperature?: number; }
export interface CompleteResult { text: string; usage?: unknown; }

export class LLMClient {
  private readonly base = process.env.LLM_BASE_URL ?? 'https://hackathon.bitgetops.com/v1';
  private readonly key = process.env.LLM_API_KEY ?? '';
  private readonly cheapModel = process.env.LLM_CHEAP_MODEL ?? 'qwen3.8-max';
  private readonly strongModel = process.env.LLM_STRONG_MODEL ?? 'qwen3.8-max';
  // Provider-specific headers (JSON object). Empty for a plain OpenAI/Qwen endpoint; set for a
  // gateway that gates on client identity (e.g. AgentRouter requires claude-cli UA + x-app:cli).
  private readonly extraHeaders: Record<string, string> = (() => {
    try { return JSON.parse(process.env.LLM_EXTRA_HEADERS ?? '{}'); } catch { return {}; }
  })();

  private cacheKey(messages: LLMMessage[], opts: CompleteOpts): string {
    return createHash('sha256').update(JSON.stringify({ messages, opts })).digest('hex');
  }

  async complete(messages: LLMMessage[], opts: CompleteOpts = {}): Promise<CompleteResult> {
    const model = opts.model ?? this.cheapModel;
    const keyed: CompleteOpts = { ...opts, model };
    const hash = this.cacheKey(messages, keyed);
    const file = path.join(CACHE_DIR, `${hash}.json`);

    // Cache hit → deterministic replay, zero network.
    try {
      return JSON.parse(await readFile(file, 'utf8')) as CompleteResult;
    } catch { /* miss → network */ }

    let lastErr: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`${this.base}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.key}`,
            ...this.extraHeaders,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: opts.temperature ?? 0.4,
            ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
          }),
        });
        if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 300)}`);
        const j = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
          usage?: unknown;
        };
        const out: CompleteResult = { text: j.choices?.[0]?.message?.content ?? '', usage: j.usage };
        await mkdir(CACHE_DIR, { recursive: true });
        await writeFile(file, JSON.stringify(out));
        return out;
      } catch (e) {
        lastErr = e;
      }
    }
    // ESCALATE — never fabricate an argument/verdict (INVARIANTS).
    throw new Error(`LLM_ESCALATE: ${String(lastErr)}`);
  }

  cheap(): string { return this.cheapModel; }
  strong(): string { return this.strongModel; }
}
