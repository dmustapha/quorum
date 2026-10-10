// File: scripts/verify-claims.ts
// TRUE INDEPENDENT RECOMPUTE (T5 / INVARIANT: verify-before-claiming).
//
// The SOURCE OF TRUTH is evidence/backtest-events.jsonl — the raw per-event rows. This script
// re-derives both arms' OOS avg-P&L + hit-rate FROM THOSE ROWS, applies the SAME verdict rule the
// harness uses (deriveVerdict), and only THEN diffs the independently-recomputed verdict + numbers
// against (a) the stored backtest-result.json.verdict and (b) the headline numbers in CLAIMS.md.
//
// It must be FALSIFIABLE: a hand-crafted/corrupted backtest-result.json (or a CLAIMS.md edited to a
// verdict/number the rows do not support) exits 1 CLAIM_MISMATCH. The stored verdict field is NEVER
// trusted as truth — it is a claim to be checked against the recompute.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { deriveVerdict, gate, pnlOf } from '../src/core/backtest';
import type { Action } from '../src/core/types';

// Richer raw row. The RAW action+conviction+fwdRet are the source of truth; verify re-applies the
// SAME config.convictionBar in CODE (gate/pnlOf) to re-derive each arm's OOS aggregate — it does
// NOT trust the stored panelPnl/panelTraded fields (those are a claim to be reproduced).
interface Row {
  isOos: boolean;
  panelConv: number; panelAction: Action; ablConv: number; ablAction: Action;
  fwdRet: number | null;
}
interface ArmAgg { avg: number; hit: number; trades: number; }

// Recompute an arm's OOS aggregate by re-gating raw rows under `bar`. avg over TRADED rows;
// hitRate = wins/trades. Identical gate/pnl functions the harness used.
function oosAgg(rows: Row[], arm: 'panel' | 'abl', bar: number): ArmAgg {
  const oos = rows.filter((r) => r.isOos);
  const pnls: number[] = [];
  for (const r of oos) {
    const action = arm === 'panel' ? r.panelAction : r.ablAction;
    const conv = arm === 'panel' ? r.panelConv : r.ablConv;
    if (gate(action, conv, bar).traded && r.fwdRet !== null) pnls.push(pnlOf(action, conv, bar, r.fwdRet));
  }
  if (!pnls.length) return { avg: 0, hit: 0, trades: 0 };
  const avg = pnls.reduce((s, p) => s + p, 0) / pnls.length;
  const wins = pnls.filter((p) => p > 0).length;
  return { avg, hit: wins / pnls.length, trades: pnls.length };
}

// Extract a headline avg-P&L number from CLAIMS.md if one is present (post-P2.3). Returns null when
// the placeholder (<recompute>) is still there — pre-fill state is tolerated, a real number is enforced.
function claimNumber(claims: string, label: string): number | null {
  const re = new RegExp(`${label}[^\\n]*?(-?\\d+(?:\\.\\d+)?)\\s*%`);
  const m = claims.match(re);
  return m ? Number(m[1]) : null;
}

async function main() {
  const root = process.cwd();
  const rowsTxt = await readFile(path.join(root, 'evidence', 'backtest-events.jsonl'), 'utf8');
  const rows: Row[] = rowsTxt.split('\n').filter(Boolean).map((l) => JSON.parse(l));

  // The bar is a CODE policy read from the stored config — re-applied to the RAW rows below.
  const result = JSON.parse(await readFile(path.join(root, 'evidence', 'backtest-result.json'), 'utf8'));
  const bar = Number(result?.config?.convictionBar ?? 0.6);

  // (1) INDEPENDENT recompute from raw rows under the SAME code-level bar — the source of truth.
  const panel = oosAgg(rows, 'panel', bar), abl = oosAgg(rows, 'abl', bar);
  const recomputed = deriveVerdict(panel.avg, abl.avg, panel.hit, abl.hit);

  // (2) Compare against stored result (treated as an untrusted claim).
  const storedPanel = result?.panel?.oos?.avgPnlPct;
  const storedAbl = result?.ablation?.oos?.avgPnlPct;
  const storedVerdict = result?.verdict;
  const driftPanel = Math.abs(panel.avg - Number(storedPanel)) > 1e-6;
  const driftAbl = Math.abs(abl.avg - Number(storedAbl)) > 1e-6;

  // (3) Compare against CLAIMS.md — verdict token + headline numbers (when filled).
  const claims = await readFile(path.join(root, 'CLAIMS.md'), 'utf8');
  const hasBeats = claims.includes('PANEL_BEATS_OOS'), hasLoses = claims.includes('PANEL_LOSES_OOS');
  // CLAIMS.md lists both tokens as options until P2.3 commits one; a single committed token must match.
  const claimedVerdict = hasBeats && !hasLoses ? 'PANEL_BEATS_OOS' : hasLoses && !hasBeats ? 'PANEL_LOSES_OOS' : 'UNRESOLVED';
  const claimPanel = claimNumber(claims, 'Panel OOS avg P&L');
  const claimAbl = claimNumber(claims, 'Ablation OOS avg P&L');
  const claimPanelDrift = claimPanel !== null && Math.abs(panel.avg - claimPanel) > 5e-3;
  const claimAblDrift = claimAbl !== null && Math.abs(abl.avg - claimAbl) > 5e-3;

  const fail =
    recomputed !== storedVerdict ||
    driftPanel || driftAbl ||
    claimedVerdict !== recomputed ||
    claimPanelDrift || claimAblDrift;

  if (fail) {
    console.error(
      `CLAIM_MISMATCH: recomputed=${recomputed} (panelOOS=${panel.avg.toFixed(4)}% hit=${panel.hit.toFixed(3)} / ablOOS=${abl.avg.toFixed(4)}% hit=${abl.hit.toFixed(3)}, ${rows.length} rows)\n` +
      `  stored: verdict=${storedVerdict} panelOOS=${storedPanel} ablOOS=${storedAbl} (driftPanel=${driftPanel} driftAbl=${driftAbl})\n` +
      `  CLAIMS.md: verdict=${claimedVerdict} panelOOS=${claimPanel ?? 'n/a'} ablOOS=${claimAbl ?? 'n/a'} (drift panel=${claimPanelDrift} abl=${claimAblDrift})`,
    );
    process.exit(1);
  }
  console.log(`OK: ${recomputed} — panel OOS avg ${panel.avg.toFixed(3)}% (hit ${(panel.hit * 100).toFixed(1)}%) vs ablation ${abl.avg.toFixed(3)}% (hit ${(abl.hit * 100).toFixed(1)}%), independently recomputed from ${rows.length} committed event rows.`);
}
main();
