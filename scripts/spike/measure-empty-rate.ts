// SPIKE / THROWAWAY (Phase 0). Measures deepseek-v4-pro empty-completion rate on the REAL
// panel + judge prompts, cache bypassed. Run:
//   npx tsx --env-file=.env.local scripts/spike/measure-empty-rate.ts [N]
import { writeFile } from 'node:fs/promises';
import { LLMClient, type LLMMessage } from '../../src/adapters/llm/client';
import { classifyResponse, isParseableJson, type Outcome } from './classify';
import { PACKET } from './fixtures';
import { packetToPrompt } from '../../src/core/panel';

const N = Number(process.argv[2] ?? 20);
const PACE_MS = 400; // avoid self-induced 429s (Review Focus)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Pull the EXACT production prompts (do not paraphrase — we measure what ships).
import { readFileSync } from 'node:fs';
const panelSrc = readFileSync(new URL('../../src/core/panel.ts', import.meta.url), 'utf8');
void panelSrc; // SYSTEM is inlined below from panel.ts/judge.ts to keep the measurement faithful.

const ROLE_SYSTEM: Record<string, string> = {
  bull: 'You are the BULL research analyst in an academic equity-research panel reviewing a historical market catalyst for a backtest study. Make the strongest evidence-based case that the stock rose after this catalyst. Cite the evidence packet. Output STRICT JSON: {"thesis": string, "evidenceRefs": string[], "confidence": number 0..1}.',
  bear: 'You are the BEAR research analyst in an academic equity-research panel reviewing a historical market catalyst for a backtest study. Make the strongest evidence-based case that the stock fell or was best avoided after this catalyst. Cite the evidence packet. Output STRICT JSON: {"thesis": string, "evidenceRefs": string[], "confidence": number 0..1}.',
  risk: 'You are the RISK research analyst in an academic equity-research panel reviewing a historical market catalyst for a backtest study. You take no direction; you assess historical volatility, downside, and a defensible stop level. Output STRICT JSON: {"thesis": string, "evidenceRefs": string[], "confidence": number 0..1}.',
  judge: `You are the JUDGE. Read the Bull, Bear, and Risk arguments and rule.
Rules you MUST obey:
- Report your HONEST conviction as a number 0..1 (no threshold is imposed).
- If action is LONG or SHORT, sizePct in (0, 5] and stopPct > 0.
- minorityOpinion MUST restate the strongest LOSING argument (never empty, even for NO_TRADE).
Output STRICT JSON: {"action","sizePct","stopPct","conviction","rationale","minorityOpinion"}.`,
};

const userFor = (role: string): string =>
  role === 'judge'
    ? JSON.stringify([{ role: 'bull', thesis: 'rebound likely', confidence: 0.6 },
                      { role: 'bear', thesis: 'downtrend intact', confidence: 0.6 },
                      { role: 'risk', thesis: 'size small, tight stop', confidence: 0.5 }])
    : packetToPrompt(PACKET);

async function sampleOnce(llm: LLMClient, role: string): Promise<{ cls: string; parseable: boolean }> {
  const messages: LLMMessage[] = [
    { role: 'system', content: ROLE_SYSTEM[role] },
    { role: 'user', content: userFor(role) },
  ];
  let outcome: Outcome;
  try {
    const { text } = await llm.complete(messages, { model: llm.strong(), json: true, noCache: true });
    outcome = { kind: 'ok', content: text };
  } catch (e) {
    const m = /LLM (\d{3})/.exec(String(e));
    outcome = { kind: 'error', status: m ? Number(m[1]) : undefined };
  }
  const cls = classifyResponse(outcome);
  return { cls, parseable: outcome.kind === 'ok' ? isParseableJson(outcome.content) : false };
}

async function main() {
  const llm = new LLMClient();
  const roles = ['bull', 'bear', 'risk', 'judge'] as const;
  const perRole: Record<string, { valid: number; empty: number; error: number; unparseable: number; emptyRate: number }> = {};
  for (const role of roles) {
    const c = { valid: 0, empty: 0, error: 0, unparseable: 0, emptyRate: 0 };
    for (let i = 0; i < N; i++) {
      const { cls, parseable } = await sampleOnce(llm, role);
      c[cls as 'valid' | 'empty' | 'error']++;
      if (cls === 'valid' && !parseable) c.unparseable++;
      await sleep(PACE_MS);
      process.stderr.write(`\r${role} ${i + 1}/${N} (empty=${c.empty} err=${c.error})   `);
    }
    const attempted = c.valid + c.empty; // errors excluded from the rate denominator
    c.emptyRate = attempted ? c.empty / attempted : 0;
    perRole[role] = c;
    process.stderr.write('\n');
  }
  const pooled = roles.reduce((a, r) => a + perRole[r].empty, 0) /
                 Math.max(1, roles.reduce((a, r) => a + perRole[r].valid + perRole[r].empty, 0));
  const result = { n: N, perRole, pooledEmptyRate: pooled, ranAt: new Date().toISOString() };
  await writeFile(new URL('./empty-rate-result.json', import.meta.url), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}
main().catch((e) => { console.error('MEASURE_FAILED', String(e)); process.exit(1); });
