# Quorum / Voir Dire — Domain Guide

A single reference for the concepts, rules, and vocabulary the decision engine runs on.
Every concept maps to a concrete type or function in `src/`, so a reader can move from idea to
code without guessing.

## 1. What the system does

Quorum is an **event-driven trading agent**. For a scheduled market **catalyst** (an earnings
release or a macro event on a known date), it convenes an **adversarial panel** of LLM analysts,
has a **Judge** rule on their debate, and — only when conviction clears a pre-registered bar —
places a **paper order** on Bitget Demo. Every decision, including the losing side, is written to
an append-only **audit** log that can be independently recomputed.

The honest claim is **auditability and decision-provenance**, not guaranteed alpha. Whether the
panel beats a single-LLM baseline is measured out-of-sample and reported either way.

## 2. Key concepts

| Concept | Plain meaning | In code |
|---|---|---|
| **rToken** | A Bitget tokenized-equity spot market (e.g. `RNVDAUSDT` = tokenized NVDA). | `universe.json`, `CatalystEvent.symbol` |
| **Catalyst** | A dated event expected to move price (earnings / macro). | `CatalystEvent` |
| **Earnings vs macro event** | Earnings = single-company report; macro = economy-wide (CPI, FOMC). | `EventType` |
| **OHLCV** | Open/High/Low/Close/Volume candle — one trading day. | `Candle` |
| **SMA20** | 20-day simple moving average of close — trend reference. | `collector.ts` `sma()` |
| **ATR14** | 14-day average true range — volatility / stop-sizing reference. | `collector.ts` `atr()` |
| **Forward return** | % price change from the catalyst-day close to `horizonDays` later — the outcome a trade is scored on. | `backtest.ts` `forwardReturn()` (P2) |
| **In-sample (IS)** | Events on/before the OOS cutoff — may inform prompts/constants. | `BacktestConfig.oosCutoff` |
| **Out-of-sample (OOS)** | Events strictly after the cutoff — scored, never fit on. | `backtest.ts` partition |
| **Strict cutoff (`asOf`)** | No data at/after the catalyst date is ever shown to the panel. | `EvidencePacket.asOf`, `collector.ts` `c.ts < cutoffMs` |
| **Conviction bar** | Minimum Judge conviction to trade at all (pre-registered 0.6). | `DEFAULT_CONVICTION_BAR` |
| **Minority opinion** | The strongest LOSING argument, preserved on every verdict. | `JudgeVerdict.minorityOpinion` |
| **Single-LLM ablation** | The identical pipeline minus the debate — one model, one call — the comparison foil. | `backtest.ts` `ablationDecision()` (P2) |
| **Hit rate** | Fraction of trades with positive P&L. | `ArmMetrics.hitRate` |
| **Sharpe-like** | `mean(tradePnl) / stdev(tradePnl)`, Rf=0, population stdev, NOT annualized. | `metrics.ts` |
| **Max drawdown** | Largest peak-to-trough equity drop over the trade sequence. | `metrics.ts` |
| **Paper trading / Bitget Demo** | Orders hit Bitget's Demo environment — real API, no real money. | `agenthub.ts` `paperTrading` |
| **Evidence hash** | `sha256(packet)` tying an audit row to its exact inputs. | `audit.ts` `hashPacket()` |
| **`strategy_order`** | The Agent Hub call that places the order. | `agenthub.ts` |

## 3. The rules (invariants in plain language)

1. **The Judge is the only trigger.** An order can only be built inside `Executor.execute(verdict)`.
   There is no `placeOrder(symbol, side, size)` surface — remove the panel and no trade is possible.
2. **No fabricated fills.** Every order result is a real Bitget Demo response or an honest
   `{status:'rejected', error}` / `{status:'skipped'}`. A mock success is never stored.
3. **No future data before `asOf`.** The panel never sees a candle at/after the catalyst date;
   signals with no point-in-time history are suppressed entirely in backtest.
4. **Dissent is never empty.** `minorityOpinion` is schema-required non-empty on every verdict,
   even for NO_TRADE.
5. **The ablation is real and the verdict is computed.** The single-LLM arm runs the same packets;
   "panel beats baseline" ships only if it recomputes true.

## 4. The conviction gate

The Judge sets `action = NO_TRADE` whenever `conviction < convictionBar`. The code re-enforces this
even if the LLM disobeys (defense-in-depth), and the Executor re-checks it a third time
(`NO_VERDICT_NO_ORDER`). A below-bar decision can never reach the order path.

## 5. Glossary: domain → code

- catalyst → `CatalystEvent`
- evidence packet (what the panel sees) → `EvidencePacket`
- debate → `DebateTranscript` (`arguments: bull | bear | risk`)
- verdict → `JudgeVerdict`
- dissent → `JudgeVerdict.minorityOpinion`
- cutoff → `EvidencePacket.asOf` / `BacktestConfig.oosCutoff`
- baseline → `BacktestResult.ablation`
- order outcome → `OrderResult`
- audit row → `DecisionRecord`

## 6. Failure behavior (degradation ladder)

| When | What happens |
|---|---|
| LLM fails twice | `LLM_ESCALATE` thrown — the run aborts honestly, no audit row. |
| Judge verdict won't parse twice | `VERDICT_SCHEMA_INVALID: <issue>`; empty dissent specifically → `MINORITY_MISSING`. |
| A signal skill throws / package missing | that field is omitted; the packet is still valid. |
| Signals requested for a past `asOf` | all signals suppressed (OOS leak prevention). |
| Fewer than 21 pre-cutoff candles | `OOS_LEAK_GUARD` thrown; the event is skipped, never interpolated. |
| Order rejected by Bitget | `{status:'rejected', error}` audited verbatim. |
