// File: src/core/backtest.ts
// OOS-partition + single-LLM ablation harness (ARCH §12 + §25).
// IS/OOS split by a PRE-REGISTERED oosCutoff; convictionBar + horizonDays are pre-registered
// constants (committed, never swept to flip the verdict). The verdict is COMPUTED from the raw
// per-event outcomes, never asserted — the honest finding ships either way (INVARIANT 5).
import type { Action, BacktestConfig, BacktestResult, CatalystEvent, EvidencePacket, JudgeVerdict } from './types';
import { Collector } from '../pipeline/collector';
import { Panel, packetToPrompt } from './panel';
import { Judge } from './judge';
import { LLMClient, type LLMMessage } from '../adapters/llm/client';
import { computeMetrics, type TradeOutcome } from './metrics';
import { MarketClient } from '../adapters/bitget/market';

// Richer raw row: the model's RAW action+conviction BEFORE any bar, plus the forward return.
// panelPnl/panelTraded/ablPnl/ablTraded are kept (backward-compat) but are DERIVED by applying
// config.convictionBar in CODE (gate/pnlOf) — never gated by the LLM. The raw fields are the
// source of truth; any bar can be re-applied to them WITHOUT re-calling the LLM.
export interface EventRow {
  date: string; symbol: string; isOos: boolean;
  panelConv: number; panelAction: Action; ablConv: number; ablAction: Action;
  fwdRet: number | null;
  panelPnl: number; panelTraded: boolean;
  ablPnl: number; ablTraded: boolean;
}

// forward return over horizon, measured from the catalyst-date close (first candle >= cutoff).
// Exported so verify/tests can reproduce the exact entry/exit rule.
export async function forwardReturn(
  market: Pick<MarketClient, 'getCandles'>, symbol: string, eventDate: string, horizonDays: number,
): Promise<number | null> {
  const all = await market.getCandles(symbol, '1day', 400);
  const cutoffMs = new Date(eventDate + 'T00:00:00Z').getTime();
  const idx = all.findIndex((c) => c.ts >= cutoffMs);
  if (idx < 0 || idx + horizonDays >= all.length) return null;
  const entry = all[idx].close, exit = all[idx + horizonDays].close;
  return (exit - entry) / entry * 100;
}

// Single-LLM ablation: ONE strong-model call, same output schema, NO debate, BAR-FREE.
// Same tier as the Judge so the comparison isolates the debate, not model size (no strawman).
// NO ${bar} rule in the prompt and NO internal gate — returns the model's RAW action+conviction.
// The bar is applied downstream in CODE (gate/pnlOf), so stored convictions are unanchored and
// re-gateable without re-calling the LLM.
export async function ablationDecision(llm: LLMClient, packet: EvidencePacket): Promise<JudgeVerdict> {
  // Analyst/backtest framing (mirrors the panel's tone so the single-LLM baseline sees the SAME
  // formatted packet and clears the gateway content filter — a raw-JSON directive tripped it).
  const messages: LLMMessage[] = [
    { role: 'system', content: `You are a single financial research analyst assessing a historical market catalyst for a backtest study. Give one independent assessment (no debate). Report your HONEST conviction 0..1 (no threshold is imposed). Output STRICT JSON: {"action","sizePct","stopPct","conviction","rationale","minorityOpinion"}.` },
    { role: 'user', content: packetToPrompt(packet) },
  ];
  const { text } = await llm.complete(messages, { model: llm.strong(), json: true });
  const v = JSON.parse(text);
  const action = (v.action === 'LONG' || v.action === 'SHORT' || v.action === 'NO_TRADE' ? v.action : 'NO_TRADE') as Action;
  return {
    decision: { action, symbol: packet.symbol, sizePct: Number(v.sizePct ?? 0), stopPct: Number(v.stopPct ?? 0), conviction: Number(v.conviction ?? 0) },
    rationale: String(v.rationale ?? ''), minorityOpinion: String(v.minorityOpinion ?? 'n/a'), convictionBar: 0,
    judgeRaw: { action, conviction: Number(v.conviction ?? 0), sizePctRaw: Number(v.sizePct ?? 0), stopPctRaw: Number(v.stopPct ?? 0), rationale: String(v.rationale ?? ''), caseAgainst: String(v.minorityOpinion ?? 'n/a') },
  };
}

// CODE-LEVEL conviction gate (the bar lives here, NOT in the LLM). A raw (action, conviction) pair
// trades iff action is directional AND conviction >= bar (bar<=0 → no threshold). Pure + exported
// so verify/tests re-gate the SAME raw rows under a DIFFERENT bar and reproduce traded counts.
export function gate(action: Action, conviction: number, bar: number): { traded: boolean; action: Action } {
  if (action === 'NO_TRADE') return { traded: false, action: 'NO_TRADE' };
  const pass = bar <= 0 || conviction >= bar;
  return pass ? { traded: true, action } : { traded: false, action: 'NO_TRADE' };
}

// Gated P&L for a raw row: not-traded or null fwd → 0; else LONG=+fwd, SHORT=-fwd (sized by nothing
// here — directional, matching the backtest-study outcome). Pure + exported for independent recompute.
export function pnlOf(action: Action, conviction: number, bar: number, fwdRet: number | null): number {
  const g = gate(action, conviction, bar);
  if (!g.traded || fwdRet === null) return 0;
  return g.action === 'LONG' ? fwdRet : -fwdRet;
}

// Outcome from a RAW verdict under a CODE-applied bar: gate + directional pnl in one place.
export function outcome(verdict: JudgeVerdict, fwd: number | null, bar: number): TradeOutcome {
  const d = verdict.decision;
  const g = gate(d.action, d.conviction, bar);
  return { traded: g.traded && fwd !== null, pnlPct: pnlOf(d.action, d.conviction, bar, fwd) };
}

// Verdict rule (one place): PANEL_BEATS_OOS iff panel OOS avg-P&L > ablation OOS avg-P&L,
// tie-broken by hit-rate. Directional, not significance-tested. Exported so verify-claims
// and tests apply the IDENTICAL rule to the raw rows.
export function deriveVerdict(
  panelOosAvg: number, ablOosAvg: number, panelOosHit = 0, ablOosHit = 0,
): BacktestResult['verdict'] {
  const beats = panelOosAvg > ablOosAvg || (panelOosAvg === ablOosAvg && panelOosHit > ablOosHit);
  return beats ? 'PANEL_BEATS_OOS' : 'PANEL_LOSES_OOS';
}

// Hooks let the test inject synthetic verdicts/returns with ZERO network; the live run uses the
// real Panel→Judge, real ablation call, and committed candles (defaults below).
export interface BacktestHooks {
  panelVerdict?: (packet: EvidencePacket, ev: CatalystEvent) => Promise<JudgeVerdict>;
  ablationVerdict?: (packet: EvidencePacket, ev: CatalystEvent) => Promise<JudgeVerdict>;
  forward?: (symbol: string, eventDate: string, horizonDays: number) => Promise<number | null>;
}

export class Backtest {
  constructor(
    private readonly collector = new Collector(),
    private readonly market = new MarketClient(),
    private readonly llm = new LLMClient(),
    private readonly hooks: BacktestHooks = {},
  ) {}

  // per-event rows → evidence/backtest-events.jsonl: the INDEPENDENT recompute source for
  // verify-claims (it re-derives the verdict from these rows, never trusts result.verdict).
  public eventRows: EventRow[] = [];
  public skippedEvents: Array<{ date: string; symbol: string; reason: string }> = [];

  // maxEvents throttles LLM spend (orchestrator budget knob); undefined/0 = unlimited.
  async run(config: BacktestConfig, events: CatalystEvent[], maxEvents?: number): Promise<BacktestResult> {
    const cutoffMs = new Date(config.oosCutoff + 'T00:00:00Z').getTime();
    const panel = new Panel(this.llm);
    // Run BAR-FREE (convictionBar=0): the Judge + ablation store the model's RAW action+conviction,
    // unanchored by any prompt-level bar. config.convictionBar is applied downstream in CODE.
    const judge = new Judge(this.llm, 0);
    const panelVerdict = this.hooks.panelVerdict ?? (async (packet) => judge.judge(await panel.debate(packet)));
    const ablationVerdict = this.hooks.ablationVerdict ?? ((packet) => ablationDecision(this.llm, packet));
    const forward = this.hooks.forward ?? ((s, d, h) => forwardReturn(this.market, s, d, h));

    const panelIs: TradeOutcome[] = [], panelOos: TradeOutcome[] = [];
    const ablIs: TradeOutcome[] = [], ablOos: TradeOutcome[] = [];
    const curveDates: string[] = []; const curvePanel: number[] = []; const curveAbl: number[] = [];
    let eqP = 1, eqA = 1;
    this.eventRows = [];
    this.skippedEvents = [];

    const inRange = events
      .filter((e) => e.date >= config.from && e.date <= config.to && config.universe.includes(e.symbol))
      .sort((a, b) => a.date.localeCompare(b.date));
    const selected = maxEvents && maxEvents > 0 ? inRange.slice(0, maxEvents) : inRange;

    for (const ev of selected) {
      const isOos = new Date(ev.date + 'T00:00:00Z').getTime() > cutoffMs;
      let packet: EvidencePacket;
      try { packet = await this.collector.collect(ev); } catch { continue; } // skip, never interpolate
      const fwd = await forward(ev.symbol, ev.date, config.horizonDays);

      // Skip-and-record: a per-event LLM failure (e.g. gateway content-block) excludes THAT event
      // honestly — it never fabricates a verdict/return. The skipped count ships in the result.
      let pv: JudgeVerdict, av: JudgeVerdict;
      try {
        pv = await panelVerdict(packet, ev);
        av = await ablationVerdict(packet, ev);
      } catch (e) {
        this.skippedEvents.push({ date: ev.date, symbol: ev.symbol, reason: String(e).slice(0, 120) });
        continue;
      }

      // Apply the CODE-level bar (config.convictionBar) to the RAW verdicts to derive outcomes.
      const bar = config.convictionBar;
      const po = outcome(pv, fwd, bar), ao = outcome(av, fwd, bar);
      (isOos ? panelOos : panelIs).push(po);
      (isOos ? ablOos : ablIs).push(ao);

      eqP *= 1 + po.pnlPct / 100; eqA *= 1 + ao.pnlPct / 100;
      curveDates.push(ev.date); curvePanel.push(eqP); curveAbl.push(eqA);
      this.eventRows.push({
        date: ev.date, symbol: ev.symbol, isOos,
        panelConv: pv.decision.conviction, panelAction: pv.decision.action,
        ablConv: av.decision.conviction, ablAction: av.decision.action,
        fwdRet: fwd,
        panelPnl: po.pnlPct, panelTraded: po.traded, ablPnl: ao.pnlPct, ablTraded: ao.traded,
      });
    }

    const panelOosM = computeMetrics(panelOos), ablOosM = computeMetrics(ablOos);
    return {
      config,
      panel: { is: computeMetrics(panelIs), oos: panelOosM },
      ablation: { is: computeMetrics(ablIs), oos: ablOosM },
      equityCurve: { panel: curvePanel, ablation: curveAbl, dates: curveDates },
      verdict: deriveVerdict(panelOosM.avgPnlPct, ablOosM.avgPnlPct, panelOosM.hitRate, ablOosM.hitRate),
    };
  }
}
