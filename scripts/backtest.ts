// File: scripts/backtest.ts
// Runs the OOS event-study → evidence/. PRE-REGISTERED config (oosCutoff/horizon/convictionBar)
// is literal here, committed in git, never fit to the OOS window. BACKTEST_MAX_EVENTS caps the
// number of events processed so the orchestrator can throttle LLM spend if budget runs low.
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { Backtest, type EventRow } from '../src/core/backtest';
import type { BacktestConfig, CatalystEvent } from '../src/core/types';
import catalysts from '../data/catalysts.json';
import universe from '../data/universe.json';

// Percentile via nearest-rank on a sorted ascending list. Deterministic; empty → null.
function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank - 1))];
}

// Raw (bar-free) conviction distribution per arm over all in-window scored events.
function convictionDistribution(rows: EventRow[]) {
  const PCTS = [10, 25, 50, 60, 75, 90] as const;
  const arm = (convs: number[]) => {
    const sorted = [...convs].sort((a, b) => a - b);
    const percentiles = Object.fromEntries(PCTS.map((p) => [`p${p}`, percentile(sorted, p)]));
    return { n: sorted.length, sorted, percentiles };
  };
  return {
    events: rows.length,
    panel: arm(rows.map((r) => r.panelConv)),
    ablation: arm(rows.map((r) => r.ablConv)),
  };
}

async function main() {
  const config: BacktestConfig = {
    universe: universe as string[],
    from: '2026-03-10', to: '2026-10-08',
    oosCutoff: '2026-09-08',   // >=30d held strictly OOS (to 10-08) — pre-registered
    // Bar is applied in CODE (gate/pnlOf) — not the LLM. BACKTEST_BAR re-gates the SAME cached,
    // bar-free LLM calls WITHOUT re-spending budget. Default 0.6 (pre-registered).
    horizonDays: 3, convictionBar: Number(process.env.BACKTEST_BAR ?? 0.6),
  };
  const maxEvents = Number(process.env.BACKTEST_MAX_EVENTS ?? process.argv[2] ?? 0) || undefined;

  const bt = new Backtest();
  const result = await bt.run(config, catalysts as CatalystEvent[], maxEvents);

  const dir = path.join(process.cwd(), 'evidence');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'backtest-result.json'), JSON.stringify(result, null, 2));
  // independent-recompute source: raw per-event rows (one per event)
  await writeFile(path.join(dir, 'backtest-events.jsonl'), bt.eventRows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  // honest exclusions: events a per-event LLM failure (e.g. gateway content-block) skipped
  await writeFile(path.join(dir, 'backtest-skipped.json'), JSON.stringify(bt.skippedEvents, null, 2));

  // Conviction-distribution summary — the RAW (bar-free) convictions over in-window events, sorted
  // + percentiled per arm. This is the artifact Dami uses to pick the calibrated bar (bar is a
  // CODE policy re-applied via BACKTEST_BAR, never a prompt). Do NOT pick a final bar here.
  const dist = convictionDistribution(bt.eventRows);
  await writeFile(path.join(dir, 'conviction-distribution.json'), JSON.stringify(dist, null, 2));

  const oosN = result.panel.oos.events, isN = result.panel.is.events;
  console.log(`VERDICT: ${result.verdict} (panel OOS avg ${result.panel.oos.avgPnlPct.toFixed(4)}% vs ablation ${result.ablation.oos.avgPnlPct.toFixed(4)}%) [bar=${config.convictionBar}]`);
  console.log(`events: ${bt.eventRows.length} scored (IS ${isN} / OOS ${oosN}), ${bt.skippedEvents.length} skipped${maxEvents ? ` [capped ${maxEvents}]` : ''}`);
  console.log('CONVICTION DISTRIBUTION (raw, bar-free):');
  console.log(JSON.stringify(dist, null, 2));
}
main();
