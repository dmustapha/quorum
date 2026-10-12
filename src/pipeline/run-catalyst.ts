// File: src/pipeline/run-catalyst.ts
// Orchestrator half of the pipeline (the Next.js API routes are P3). A standalone async call
// per catalyst with its own LLMClient — an LLM failure throws LOCALLY and does not corrupt the
// audit log or other runs (worker isolation). Results are schema-validated (in Judge) before
// Audit.append. The order is constructed ONLY inside Executor.execute (INVARIANT 1).

import type { CatalystEvent, DecisionRecord, JudgeVerdict } from '../core/types';
import { DEFAULT_CONVICTION_BAR } from '../core/types';
import { Collector } from './collector';
import { Panel } from '../core/panel';
import { Judge } from '../core/judge';
import { gate } from '../core/backtest';
import { Executor } from '../core/executor';
import { Audit } from '../core/audit';
import { AgentHub } from '../adapters/bitget/agenthub';
import { LLMClient } from '../adapters/llm/client';

export async function runCatalyst(event: CatalystEvent): Promise<DecisionRecord> {
  const llm = new LLMClient();
  const packet = await new Collector().collect(event);
  const transcript = await new Panel(llm).debate(packet);
  // Bar-free Judge + transparent code-level conviction gate — IDENTICAL to the backtest/seed path.
  // This keeps live decisions consistent with committed evidence AND replays cached catalysts from
  // the disk cache (deterministic, reliable demo; no gateway content-block on a previously-run event).
  const raw = await new Judge(llm, 0).judge(transcript);
  const g = gate(raw.decision.action, raw.decision.conviction, DEFAULT_CONVICTION_BAR);
  const verdict: JudgeVerdict = {
    ...raw,
    decision: {
      ...raw.decision,
      action: g.action,
      sizePct: g.traded ? raw.decision.sizePct : 0,
      stopPct: g.traded ? raw.decision.stopPct : 0,
    },
    convictionBar: DEFAULT_CONVICTION_BAR,
  };
  const orderResult = await new Executor(new AgentHub()).execute(verdict);
  return new Audit().append(packet, transcript, verdict, orderResult, false);
}
