# Architecture Decision Records — Quorum

## ADR-001: Backtest substrate = Bitget rToken candles (no key)
- Context: the ≥60d/30d-OOS event-study needs a historical price source for tokenized US stocks.
- Decision: use Bitget's public `/api/v2/spot/market/candles` (no key), cache to disk for determinism.
- Rejected: external stock OHLCV (not the sponsor's data, weaker "deep integration" story) and synthetic data (dishonest, defeats the OOS claim). Declined because native sponsor data is both the honesty and the depth win, and it is live-verified (200d).
- Consequence: buys native integration + reproducibility; costs us dependence on Bitget uptime (mitigated by committed cache, R8).
- Where: src/adapters/bitget/market.ts, scripts/cache-candles.ts.

## ADR-002: Execution via Agent Hub --paper-trading (Bitget Demo)
- Context: the Judge's decision must place a real order to satisfy "real working agent".
- Decision: route through `bitget-agent-sdk` `strategy_order` with `--paper-trading`.
- Rejected: live-money (out of scope + unsafe in 60h) and simulated fills (fabricated — forbidden by INVARIANT 2). Declined because paper gives honest run records with zero fabrication.
- Consequence: honest fills, no mainnet risk; costs us "real P&L" realism (acceptable, disclosed in LIMITATIONS).
- Where: src/adapters/bitget/agenthub.ts, src/core/executor.ts.

## ADR-003: Adversarial panel + Judge with preserved dissent
- Context: the decision mechanism must be novel and the most shareable demo.
- Decision: Bull/Bear/Risk debate → Judge rules → minority opinion always shown.
- Rejected: pipeline-of-agents (NightDesk — discards dissent) and single-LLM (the ablation foil). Declined because preserved dissent is the unoccupied differentiator and the social-lane wedge.
- Consequence: 4 LLM calls/trade (cost/latency, R3, mitigated by cache + cheap/strong split); buys novelty + auditability.
- Where: src/core/panel.ts, src/core/judge.ts.

## ADR-004: Judge takes a verdict, never loose order params (structural invariant)
- Context: the thesis cheat is "fire an order without the panel".
- Decision: `Executor.execute(verdict: JudgeVerdict)` is the only order surface; no `placeOrder(symbol, side, size)`.
- Rejected: a generic order API with a guard check. Declined because a type-level constraint (verdict-only) is unrepresentable-to-cheat, stronger than a runtime check.
- Consequence: the headline invariant is structural (`headlineEnforcement: "structural"`).
- Where: src/core/executor.ts.

## ADR-005: Strict OOS cutoff enforced in one place (the Collector)
- Context: OOS leakage voids the entire verifiability claim (INVARIANT 3).
- Decision: `Collector.collect` filters `c.ts < asOf` for every packet; backtest partitions IS/OOS before any aggregation.
- Rejected: per-call-site cutoff checks. Declined because a single chokepoint is auditable and cannot be bypassed by a new call path.
- Consequence: both live and backtest paths share the guard; costs a thrown `OOS_LEAK_GUARD` on thin history (acceptable — skip the event).
- Where: src/pipeline/collector.ts, src/core/backtest.ts.

## ADR-006: Wider universe over longer window for event sample
- Context: a 60d window yields few earnings events per single ticker (R2).
- Decision: 10-15 rTokens × (earnings + macro) → hundreds of event-instances within ≥60d.
- Rejected: a longer single-ticker window (still thin, and stretches the OOS hold-out awkwardly). Declined because width gives statistical substance without extending the window.
- Consequence: more LLM calls (cost, mitigated by cache); buys a meaningful OOS sample.
- Where: data/universe.json, data/catalysts.json, src/core/backtest.ts.
