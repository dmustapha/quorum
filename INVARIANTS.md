# INVARIANTS — Build-Agent Law (Quorum)
> The build agent reads this as non-negotiable law. Violating any NON-NEGOTIABLE fails the hackathon gate.

## NON-NEGOTIABLES
1. **The Judge's `TradeDecision` is the SOLE order trigger.** — Test: grep the codebase — the only call site of the Agent Hub `strategy_order`/paper-order path is inside `Executor.execute(verdict)`, reached only when `verdict.decision.action !== 'NO_TRADE'`. Remove the Panel+Judge and no order can be constructed. — Judge-attack: a skeptic tries to fire an order by hitting the executor/API directly without a verdict, or with a hand-crafted decision. → Defense: `Executor.execute` accepts only a schema-validated `JudgeVerdict` produced by `Judge.judge()`; a call with no verdict or a decision whose `conviction < convictionBar` is rejected fail-closed and returns state token `NO_VERDICT_NO_ORDER`. **Headline invariant — made structurally unrepresentable:** `Executor.execute` takes a `JudgeVerdict`, not loose order params; there is no `placeOrder(symbol, side, size)` public surface. `headlineEnforcement: "structural"`.
2. **No fabricated fills.** — Test: every `OrderResult` in the audit store carries a raw Bitget Demo API response object (orderId/status) or an explicit `{status:'rejected', error}` / `{status:'skipped'}`; none are synthesized. — Judge-attack: judge checks whether a "successful" order id is real against the Demo API. → Defense: `Executor` returns the raw SDK response verbatim; on SDK error it returns `ORDER_REJECTED` with the raw error — never a stored-success substitute.
3. **OOS is strict — never fit on the test window.** — Test: in `BacktestHarness.run`, every prompt, threshold, and the conviction bar are derived only from events with `date <= config.oosCutoff`; events with `date > oosCutoff` feed metrics only. — Judge-attack: judge looks for any OOS event influencing a parameter, prompt, or the bar. → Defense: `EvidencePacket.asOf` is set to the event date and C3 refuses candles after `asOf`; the harness partitions before any aggregation and returns `OOS_LEAK_GUARD` fail-closed if an OOS event is seen during the IS/fit pass.
4. **The minority (losing) opinion is always shown.** — Test: `JudgeVerdict.minorityOpinion` is non-empty for every verdict (including NO_TRADE); the decision card renders it. — Judge-attack: judge looks for a decision card with no dissent / an empty minority block. → Defense: Judge JSON-schema requires a non-empty `minorityOpinion`; schema-validation rejects an empty one and retries, returning `MINORITY_MISSING` after 2 failures rather than shipping a verdict without dissent.
5. **The single-LLM ablation is mandatory and the real verdict ships.** — Test: `BacktestResult.ablation` is populated from a real single-LLM arm over the SAME packets; `BacktestResult.verdict ∈ {PANEL_BEATS_OOS, PANEL_LOSES_OOS}` is computed, not asserted; CLAIMS.md states whichever is true. — Judge-attack: judge suspects the ablation is a strawman or the "beats" claim is unbacked. → Defense: the ablation runs the identical pipeline minus the debate (one LLM, one call); `verify-claims` recomputes the OOS comparison from committed events and emits `CLAIM_MISMATCH` if CLAIMS.md disagrees with the recomputation.

### MUST NOT CLAIM
- Must NOT claim live/real-money trading — paper/Demo only.
- Must NOT claim the panel "beats" a single-LLM baseline unless `BacktestResult.verdict === 'PANEL_BEATS_OOS'` recomputes true; otherwise the honest finding (auditability/decision-provenance, not alpha) is the claim.
- Must NOT present seeded demo decisions as anything but real prior runs.
- Must NOT claim any metric not recomputable from `evidence/`.

## SURVIVING FINDINGS (per-doc critical review A-G4 — folded in as build law)
- convictionBar and horizonDays are PRE-REGISTERED constants (0.6 / 3d), committed before the OOS window is touched; never swept on OOS to flip the verdict (OOS-3 integrity).
- `sharpeLike = mean(tradePnl)/stdev(tradePnl)`, Rf=0, population stdev, NOT annualized — defined precisely so a judge recomputes it from committed event rows.
- Signal data (bitget-signal) has NO point-in-time history → it is SUPPRESSED entirely in backtest (asOf in the past); the panel argues on price context only OOS. Live path only uses signals when asOf is today. Closes the signal OOS-leak.
- `verify-claims.ts` recomputes OOS avg-P&L from the RAW `evidence/backtest-events.jsonl` rows, not by re-reading the stored verdict; a corrupted/hand-crafted result cannot pass.
- The ENTIRE Next.js app (UI + API routes + audit disk) deploys as ONE stateful Railway service with a persistent volume; it is NOT split to Vercel serverless (ephemeral FS drops audit writes — the R11 leash vector).
- The `/proof` server component reads audit + CLAIMS.md DIRECTLY from the process; it never does a relative `fetch('/api/proof')` (throws in Node SSR with no base URL).
- `presetStopLossPrice` expects an ABSOLUTE price on Bitget — convert `stopPct` to an absolute stop at build (`entry*(1∓stopPct/100)`); shipping the raw percent places a nonsense stop.
- Candle history depth MUST be verified back to the backtest `from` date per symbol (P0 gate); the ≥60d/30d-OOS bar is non-negotiable.
- The seed set MUST contain ≥1 ACCEPTED paper order (real orderId); a `/proof` page of only rejections does not prove execution — escalate.
- `durability-tier.json.spendApproved` gates the paid durable deploy; unset/false BLOCKs (never silent free-tier spin-down).

## VERIFY-BEFORE-CLAIMING
Every headline number/order-id/hash in README/demo/submission must be RECOMPUTABLE from a committed source (`evidence/backtest-events.jsonl`, the audit JSONL) via `scripts/verify-claims.ts`. No unbacked figure ships.

## RESOLVED DECISIONS
| # | Question | Options considered | Chosen | Why not the others | Status |
|---|---|---|---|---|---|
| D-1 | Backtest substrate | Bitget rToken candles / external stock OHLCV / synthetic | Bitget rToken candles (no key) | Native to the sponsor (depth), live-verified 200d, honest "Bitget's own data" | RESOLVED |
| D-2 | Execution path | Agent Hub paper / live money / simulated fills | Agent Hub `--paper-trading` (Demo) | Live money out of scope + unsafe in 60h; simulated = fabricated fills (forbidden) | RESOLVED |
| D-3 | Decision mechanism | adversarial panel+Judge / pipeline / single-LLM | adversarial panel + Judge, dissent preserved | Pipeline (NightDesk) discards dissent; single-LLM is the ablation foil, not the product | RESOLVED |
| D-4 | LLM provider | Qwen/Kimi K3 (sponsor) / OpenAI / Anthropic | Qwen/Kimi K3 | Sponsor credits; cost control for 4-call debates; OpenAI-compatible so swappable | RESOLVED |
| D-5 | Event sample width vs window | longer window / wider universe | wider universe (10-15 rTokens × earnings+macro) | A longer window still yields thin events; width → hundreds of instances within ≥60d | RESOLVED |
| D-6 | LLM model ids + exact endpoint | — | OPEN | build-DISCOVERED FACT — pinned from sponsor credits at build | OPEN |
| D-7 | bitget-agent-sdk exact call signature | — | OPEN | build-DISCOVERED FACT — pinned via a 1-call spike at build | OPEN |

## SOURCE LOCK
| External identifier | Version / pin | Verify command | Expected output | Status |
|---|---|---|---|---|
| Bitget candles API | `/api/v2/spot/market/candles` v2 | `curl 'https://api.bitget.com/api/v2/spot/market/candles?symbol=RNVDAUSDT&granularity=1day&limit=5'` | `code:"00000"`, 5 OHLCV rows | [VERIFIED-in-forge] |
| Bitget tickers API | `/api/v2/spot/market/tickers` v2 | `curl '.../tickers' \| grep RAAPLUSDT` | symbol present (2833 rTokens) | [VERIFIED-in-forge] |
| bitget-agent-sdk | `npx @bitget-ai/bitget-agent-installer upgrade-all` | import + `--paper-trading` dry call | strategy_order present | [UNVERIFIED-build-gate] |
| bitget-signal | installer (no key) | call one skill | signal JSON | [UNVERIFIED-build-gate] |
| Qwen/Kimi K3 | sponsor endpoint + model ids | `/v1/chat/completions` JSON-mode probe | 200 + parseable | [UNVERIFIED-build-gate] |

## ESCALATE, DON'T FABRICATE
On any gate/task failure: stop, record BLOCKED with the failing gate name, and NEVER substitute a mock, cached result, stored-success response, or fabricated count. Triage when over budget: cut stretch (rebuttal round, extra tickers, polish), then P1; NEVER a P0 or a security invariant. Escalate after 2 failures on the same gate. External human review, if any, is `[HUMAN_REVIEW_REQUIRED]` documentation, never a blocking build gate.
