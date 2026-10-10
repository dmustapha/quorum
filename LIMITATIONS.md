# Limitations

## In scope (built for this submission)
- Adversarial Bull/Bear/Risk debate + Judge structured TradeDecision with preserved minority opinion.
- Judge's TradeDecision as the SOLE trigger for a real paper order on Bitget Agent Hub (Demo).
- ≥60d / ≥30d-OOS event-study over Bitget's own rToken OHLCV with a mandatory single-LLM ablation and a computed (never asserted) verdict.
- Immutable audit store of every decision; recompute-verifier re-deriving the headline numbers from committed data.
- Live web UI: landing, decision log, per-decision audit, backtest, demo, proof.

## Honest findings & operational caveats (from the live P2 run)
- **No demonstrable 3-day directional alpha from price-only evidence.** With no live news/sentiment
  feed, both the panel and a single-LLM baseline mostly abstain (NO_TRADE) — correct, well-calibrated
  behaviour, not a bug. The product's proven value is decision quality + risk control, not alpha.
- **OOS sample is thin and non-random.** Of 32 catalyst-events, 20 were dropped by the AgentRouter
  LLM-gateway's content-moderation filter (a tooling artifact). 12 scored (9 IS / 3 OOS). The
  PANEL_BEATS_OOS result (panel 0.9952% vs ablation 0.0000%) is directional/illustrative only —
  far below a significance threshold; we make NO alpha claim.
- **LLM is deepseek-v4-flash via AgentRouter, not the sponsor Qwen.** Sponsor `qwen3.8-max` not yet
  claimed; `claude-opus-4-8` has budget but its longer analyses trip the gateway content filter on
  most events, so it is unusable for the full backtest through this gateway. Code is endpoint-agnostic.
- **Execution is spot-long-only; shorts are advisory (refined-C).** Bitget lists rTokens spot-only
  (no futures/borrow — confirmed: RAMZNUSDT has no USDT-FUTURES market), so the agent's SHORT
  decisions are emitted as risk-managed ADVISORY signals (`orderResult.status="advisory"`,
  `SPOT_LONG_ONLY`), never a fabricated fill. LONG decisions are live-fillable (spot buy). This is a
  deliberate honesty/safety constraint matching what the venue actually allows.
- **Agentic account connected, no live fill.** OAuth connects the real sub-account (uid 8808304094)
  and the order path reaches Bitget's API — proven at the connection+path level. A live fill needs a
  funded demo/paper account (the OAuth key is the live, unfunded account; paper trading needs a demo key).
- **The OOS backtest is a directional-SIGNAL evaluation, not executed-strategy returns.** Short P&L
  measures the value of the panel's calls as signals; it is not a Bitget-executable strategy.

## Feature-gated (deliberately not built for this scope)
- Live real-money trading. Reason: safety + out of scope in a ~60h window; paper/Demo only (ADR-002).
- Microstructure / orderbook tape reading. Reason: data-fidelity risk in the window (WINNER-BRIEF out-of-scope).
- More than ~15 tickers or catalyst types beyond earnings+macro. Reason: scope lock to keep the OOS sample clean and the build shippable (ADR-006, R9).
- Multi-round debate beyond an optional single rebuttal. Reason: cost/latency (R3) — stretch only.
- Intraday (hourly) backtest horizon. Reason: daily OHLCV is the committed deterministic substrate; hourly is a stretch.
- Second hackathon track. Reason: honesty — a focused single-track wedge over a shallow multi-track claim.
