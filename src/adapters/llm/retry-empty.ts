// Keep-able (Phase 1). Retry-on-empty sits ON TOP of LLMClient's retry-on-error.
// Empty completion (content.trim()==='') is a generation miss and is retryable;
// a transport error is thrown by complete() and propagates unchanged (NOT an empty).
import type { LLMClient, LLMMessage, CompleteOpts, CompleteResult } from './client';

export const RETRY_ON_EMPTY = 3;

export async function completeNonEmpty(
  llm: LLMClient,
  messages: LLMMessage[],
  opts: CompleteOpts = {},
  attempts: number = RETRY_ON_EMPTY,
): Promise<CompleteResult> {
  let last: CompleteResult | undefined;
  for (let i = 0; i < Math.max(1, attempts); i++) {
    const r = await llm.complete(messages, opts);   // transport errors throw here, as before
    if (r.text.trim() !== '') return r;
    last = r;
  }
  throw new Error(`EMPTY_AFTER_RETRIES: ${attempts} attempts returned empty (last usage=${JSON.stringify(last?.usage)})`);
}
