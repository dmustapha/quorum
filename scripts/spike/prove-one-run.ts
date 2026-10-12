// SPIKE / THROWAWAY (Phase 0). Proves one full panel->judge run returns a schema-valid verdict
// live on 0G, using a minimal retry-on-empty. Run:
//   npx tsx --env-file=.env.local scripts/spike/prove-one-run.ts <retries>
import { LLMClient } from '../../src/adapters/llm/client';
import { Panel } from '../../src/core/panel';
import { Judge } from '../../src/core/judge';
import { PACKET } from './fixtures';

const RETRIES = Number(process.argv[2] ?? 3);

// Minimal retry-on-empty: LLMClient throws on empty JSON downstream (JSON.parse('')),
// so wrap the run and retry the WHOLE run on any empty-driven failure, up to RETRIES.
async function runOnce() {
  const llm = new LLMClient();
  const panel = new Panel(llm);
  const judge = new Judge(llm, 0.6); // live path, bar enforced
  const transcript = await panel.debate(PACKET);
  return judge.judge(transcript);
}

async function main() {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const verdict = await runOnce();
      const ok = !!verdict?.decision?.action && !!verdict.minorityOpinion && verdict.minorityOpinion.length > 0;
      console.log(JSON.stringify({ ok, attempt, action: verdict.decision.action, conviction: verdict.decision.conviction, minorityLen: verdict.minorityOpinion.length }));
      if (ok) return;
    } catch (e) { lastErr = e; process.stderr.write(`attempt ${attempt} failed: ${String(e)}\n`); }
  }
  console.error('PROVE_FAILED after', RETRIES, 'attempts:', String(lastErr));
  process.exit(1);
}
main();
