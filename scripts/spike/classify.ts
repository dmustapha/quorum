// Phase 0 spike support (keep-able pure logic). Classifies a single LLM outcome so the
// empty-rate measurement cannot conflate transport errors / 429s with generation misses.
export type Outcome = { kind: 'ok'; content: string } | { kind: 'error'; status?: number };
export type ResponseClass = 'valid' | 'empty' | 'error';

export function classifyResponse(o: Outcome): ResponseClass {
  if (o.kind === 'error') return 'error';
  return o.content.trim() === '' ? 'empty' : 'valid';
}

export function isParseableJson(content: string): boolean {
  try { JSON.parse(content); return true; } catch { return false; }
}
