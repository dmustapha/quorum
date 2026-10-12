// File: src/core/types.ts
export type EventType = 'earnings' | 'macro';
export type Action = 'LONG' | 'SHORT' | 'NO_TRADE';
export type Role = 'bull' | 'bear' | 'risk';

export interface Candle {
  ts: number;      // ms epoch
  open: number; high: number; low: number; close: number;
  baseVol: number; quoteVol: number;
}

export interface CatalystEvent {
  symbol: string;        // e.g. 'RNVDAUSDT'
  eventType: EventType;
  date: string;          // ISO date 'YYYY-MM-DD' — the catalyst date
  description: string;
}

export interface PriceContext {
  close: number; sma20: number; atr14: number; ret5d: number; vol: number;
}

export interface EvidencePacket {
  symbol: string;
  eventDate: string;
  eventType: EventType;
  priceContext: PriceContext;
  signals: { sentiment?: string; news?: string[]; technical?: string; macro?: string };
  asOf: string;          // strict cutoff ISO — no data after this is visible to the panel
}

export interface Argument {
  role: Role;
  thesis: string;
  evidenceRefs: string[];
  confidence: number;    // 0..1
}

export interface DebateTranscript {
  packet: EvidencePacket;
  arguments: Argument[];
  rounds: number;
}

export interface TradeDecision {
  action: Action;
  symbol: string;
  sizePct: number;       // 0..maxSizePct; 0 iff NO_TRADE
  stopPct: number;       // required when action != NO_TRADE
  conviction: number;    // 0..1
}

export interface JudgeRaw {
  action: Action;        // raw model action, pre-bar
  conviction: number;    // 0..1
  sizePctRaw: number;    // UNCLAMPED pre-gate size (model's own number, not zeroed on NO_TRADE)
  stopPctRaw: number;    // UNCLAMPED pre-gate stop
  rationale: string;
  caseAgainst: string;   // the strongest losing argument, preserved (plain-language name for minorityOpinion)
}

export interface JudgeVerdict {
  decision: TradeDecision;
  rationale: string;
  minorityOpinion: string;   // ALWAYS non-empty — preserved dissent
  convictionBar: number;
  judgeRaw: JudgeRaw;        // NEW: unclamped pre-bar assessment (powers tune-the-gate §5.1)
}

export type OrderResult =
  | { status: 'filled' | 'accepted' | 'rejected'; raw: unknown; orderId?: string; error?: string }
  | { status: 'skipped'; reason: 'NO_TRADE' }
  // Honest execution-constraint result: a directional SHORT decision that Bitget cannot fill
  // because rTokens are spot-only (no futures/borrow). The agent still DECIDED (advisory signal
  // preserved in the verdict); we never fabricate a fill. LONG decisions ARE live-fillable (spot buy).
  | { status: 'advisory'; reason: 'SPOT_LONG_ONLY'; note: string };

export interface DecisionRecord {
  id: string;
  ts: string;
  packet: EvidencePacket;
  transcript: DebateTranscript;
  verdict: JudgeVerdict;
  orderResult: OrderResult;
  evidenceHash: string;  // sha256(packet)
  forwardReturns?: Record<string, number | null>;  // NEW: realized fwd return % by horizon-days (Task 7)
}

export interface ArmMetrics {
  events: number; trades: number; hitRate: number;
  avgPnlPct: number; sharpeLike: number; maxDrawdownPct: number;
}

export interface BacktestConfig {
  universe: string[]; from: string; to: string;
  oosCutoff: string; horizonDays: number; convictionBar: number;
}

export interface BacktestResult {
  config: BacktestConfig;
  panel: { is: ArmMetrics; oos: ArmMetrics };
  ablation: { is: ArmMetrics; oos: ArmMetrics };
  equityCurve: { panel: number[]; ablation: number[]; dates: string[] };
  verdict: 'PANEL_BEATS_OOS' | 'PANEL_LOSES_OOS';
}

export const MAX_SIZE_PCT = 10;        // position cap (% of notional)
export const DEFAULT_CONVICTION_BAR = 0.6;   // pre-registered
export const DEFAULT_HORIZON_DAYS = 3;       // pre-registered forward-return window

export type StreamEvent =
  | { type: 'evidence_ready'; packet: EvidencePacket }
  | { type: 'bull_done'; arg: Argument }
  | { type: 'bear_done'; arg: Argument }
  | { type: 'risk_done'; arg: Argument }
  | { type: 'judge_ruling'; verdict: JudgeVerdict }
  | { type: 'order_placed'; orderResult: OrderResult }
  | { type: 'done'; record: DecisionRecord }
  | { type: 'error'; stage: string; message: string };
