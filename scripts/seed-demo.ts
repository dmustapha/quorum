// File: scripts/seed-demo.ts
// Generates evidence/seed-decisions.jsonl — the committed cold-start demo decisions the landing +
// /app read before any live run. Uses the SAME decision path as the backtest (bar-free Judge +
// code-level conviction gate), so the seeded demo is CONSISTENT with the committed OOS evidence
// (including the two real SHORT decisions). Orders run in dry-run (no Agentic OAuth yet) → honest
// rejected/skipped orderResult, never a fabricated fill (INVARIANT 2). LLM calls hit the disk cache
// populated by the backtest, so this is ~free and deterministic.
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { Collector } from '../src/pipeline/collector';
import { Panel } from '../src/core/panel';
import { Judge } from '../src/core/judge';
import { Executor } from '../src/core/executor';
import { AgentHub } from '../src/adapters/bitget/agenthub';
import { Audit } from '../src/core/audit';
import { gate } from '../src/core/backtest';
import { LLMClient } from '../src/adapters/llm/client';
import { DEFAULT_CONVICTION_BAR } from '../src/core/types';
import type { CatalystEvent, DecisionRecord, JudgeVerdict } from '../src/core/types';

// Representative catalysts: the two real OOS SHORT decisions + two articulate NO_TRADE decisions
// (binary-event risk control). These showcase the full mechanism — debate, verdict, preserved
// dissent, disciplined abstention, and a disciplined directional position.
const PICKS: CatalystEvent[] = [
  { symbol: 'RAMZNUSDT', eventType: 'macro', date: '2026-09-11', description: 'US CPI release (August data) — scheduled macro print' },
  { symbol: 'RAMZNUSDT', eventType: 'macro', date: '2026-09-16', description: 'FOMC interest-rate decision (September meeting) — scheduled' },
  { symbol: 'RNVDAUSDT', eventType: 'earnings', date: '2026-02-25', description: 'NVIDIA Q4 FY2026 earnings release (after close)' },
  { symbol: 'RMSTRUSDT', eventType: 'macro', date: '2026-09-16', description: 'FOMC interest-rate decision (September meeting) — scheduled' },
];

async function main() {
  const llm = new LLMClient();
  const collector = new Collector();
  const panel = new Panel(llm);
  const judge = new Judge(llm, 0); // bar-free: raw conviction, like the backtest
  const executor = new Executor(new AgentHub());
  const audit = new Audit();

  const records: DecisionRecord[] = [];
  for (const ev of PICKS) {
    let packet;
    try { packet = await collector.collect(ev); } catch (e) { console.error('skip', ev.symbol, ev.date, String(e).slice(0, 80)); continue; }
    const transcript = await panel.debate(packet);
    const raw = await judge.judge(transcript); // raw action + conviction
    // Apply the SAME transparent code-level conviction bar the backtest uses.
    const g = gate(raw.decision.action, raw.decision.conviction, DEFAULT_CONVICTION_BAR);
    const gated: JudgeVerdict = {
      ...raw,
      decision: {
        ...raw.decision,
        action: g.action,
        sizePct: g.traded ? raw.decision.sizePct : 0,
        stopPct: g.traded ? raw.decision.stopPct : 0,
      },
      convictionBar: DEFAULT_CONVICTION_BAR,
    };
    const orderResult = await executor.execute(gated); // dry-run → honest rejected/skipped
    records.push(await audit.append(packet, transcript, gated, orderResult));
    console.log(`${ev.symbol} ${ev.date}: ${gated.decision.action} conv=${gated.decision.conviction} order=${orderResult.status}`);
  }

  // Commit as the cold-start seed (Audit.list reads SEED before LIVE).
  const dir = path.join(process.cwd(), 'evidence');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'seed-decisions.jsonl'), records.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
  console.log(`seed-decisions.jsonl written: ${records.length} real decisions`);
}
main();
