// Phase 1 streaming pipeline (spec §3.1 inline-stream model, §5.4). Yields stage events as the
// live panel progresses; aborts at a hard deadline and fails honestly (no order, no fabricated record).
import { Collector } from './collector';
import { argue } from '../core/panel';          // exported + cancellable in Task 2 Step 5
import { Judge } from '../core/judge';
import { Executor } from '../core/executor';
import { AgentHub } from '../adapters/bitget/agenthub';   // NOTE: one word "agenthub"
import { Audit } from '../core/audit';
import { gate } from '../core/backtest';
import { LLMClient } from '../adapters/llm/client';
import type {
  CatalystEvent, StreamEvent, Argument, Role, DebateTranscript, JudgeVerdict,
} from '../core/types';
import { DEFAULT_CONVICTION_BAR } from '../core/types';

const DONE_EVENT: Record<Role, 'bull_done' | 'bear_done' | 'risk_done'> =
  { bull: 'bull_done', bear: 'bear_done', risk: 'risk_done' };

export async function* runCatalystStream(
  event: CatalystEvent,
  opts: { deadlineMs?: number; bar?: number; signal?: AbortSignal; noCache?: boolean } = {},
): AsyncGenerator<StreamEvent> {
  const deadlineMs = opts.deadlineMs ?? 90_000;
  const bar = opts.bar ?? DEFAULT_CONVICTION_BAR;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), deadlineMs);
  // Chain an external signal (client disconnect → route calls cancel() → aborts this run too).
  if (opts.signal) opts.signal.addEventListener('abort', () => ac.abort(), { once: true });
  const llm = new LLMClient();
  // Per-call opts for every LLM hit: deadline-cancellable; cache serves in production (noCache falsy),
  // tests pass noCache:true to hit the stubbed fetch deterministically (committed .llm-cache otherwise replays).
  const llmOpts = { signal: ac.signal, noCache: opts.noCache };

  try {
    // 1. Evidence (committed candles → no network; honor abort between stages)
    const packet = await new Collector().collect(event);
    if (ac.signal.aborted) { yield { type: 'error', stage: 'deadline', message: 'run exceeded deadline' }; return; }
    yield { type: 'evidence_ready', packet };

    // 2. Analysts in PARALLEL (latency), surfaced as each COMPLETES via a shrinking race map.
    //    Reuses the exported, cancellable argue() — same prompts/parse as Panel.debate (DRY).
    const pending = new Map<Role, Promise<{ role: Role; arg: Argument }>>(
      (['bull', 'bear', 'risk'] as Role[]).map((role) => {
        const p = argue(llm, role, packet, llmOpts).then((arg) => ({ role, arg }));
        // Attach no-op catch so unhandled-rejection warnings don't fire when this promise is orphaned
        // (race picks another analyst that rejects, leaving this one un-awaited). The map still holds `p`,
        // so Promise.race() still sees rejections and honest-fail path works.
        p.catch(() => {});
        return [role, p];
      }),
    );
    const settled: Argument[] = [];
    while (pending.size > 0) {
      // Promise.race rejects if ANY analyst rejects (empty-exhaustion / abort) → caught below as honest-fail.
      const { role, arg } = await Promise.race(pending.values());
      pending.delete(role);
      settled.push(arg);
      yield { type: DONE_EVENT[role], arg };
      if (ac.signal.aborted) { yield { type: 'error', stage: role, message: 'run exceeded deadline' }; return; }
    }

    const transcript: DebateTranscript = { packet, arguments: settled, rounds: 1 };

    // 3. Judge (bar-free → raw verdict incl. judgeRaw), then re-gate in pure code (mirrors run-catalyst).
    //    Pass the same llmOpts so a hung judge fetch is deadline-cancellable (and test-hermetic).
    const raw: JudgeVerdict = await new Judge(llm, 0).judge(transcript, llmOpts);
    if (ac.signal.aborted) { yield { type: 'error', stage: 'judge', message: 'run exceeded deadline' }; return; }
    const g = gate(raw.decision.action, raw.decision.conviction, bar);
    const verdict: JudgeVerdict = {
      ...raw,                                     // carries judgeRaw through
      decision: {
        ...raw.decision,
        action: g.action,
        sizePct: g.traded ? raw.judgeRaw.sizePctRaw : 0,
        stopPct: g.traded ? raw.judgeRaw.stopPctRaw : 0,
      },
      convictionBar: bar,
    };
    yield { type: 'judge_ruling', verdict };

    // 4. Order (single call-site preserved) — only reached on a successful, non-aborted run.
    const orderResult = await new Executor(new AgentHub()).execute(verdict);
    yield { type: 'order_placed', orderResult };

    // 5. Persist via the REAL Audit.append signature (it builds id/ts/evidenceHash + returns the record).
    //    Live run → forwardReturns omitted (backfilled only for the seed corpus, Task 7).
    const record = await new Audit().append(packet, transcript, verdict, orderResult);
    yield { type: 'done', record };
  } catch (e) {
    // Honest failure — NO order, NO fabricated record past this point.
    yield { type: 'error', stage: 'run', message: String(e) };
  } finally {
    clearTimeout(timer);
  }
}
