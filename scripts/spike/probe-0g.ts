// SPIKE / THROWAWAY (Phase 0). Proves the 0G endpoint answers with deepseek-v4-pro.
// Run: npx tsx --env-file=.env.local scripts/spike/probe-0g.ts
import { LLMClient } from '../../src/adapters/llm/client';

async function main() {
  const llm = new LLMClient();
  const { text } = await llm.complete(
    [{ role: 'user', content: 'Reply with the single word: ok' }],
    { model: llm.strong(), temperature: 0 },
  );
  // Never print the key or full env — only the result.
  console.log(JSON.stringify({ ok: text.trim().length > 0, sample: text.trim().slice(0, 40) }));
}
main().catch((e) => { console.error('PROBE_FAILED', String(e)); process.exit(1); });
