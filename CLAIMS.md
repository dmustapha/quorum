# CLAIMS — Quorum / Voir Dire

> Every number here recomputes from committed data via `scripts/verify-claims.ts` (independent
> recompute from `evidence/backtest-events.jsonl`, not a read-back). No unbacked figure ships.

## What Quorum is
An adversarial Bull/Bear/Risk LLM panel debates each tokenized-US-stock catalyst; a Judge issues
the sole order-triggering decision **with the minority opinion preserved on every verdict**, places
a risk-managed paper order on Bitget Agent Hub, and audits the whole chain. Validated against a
single-LLM baseline (ablation) on a strict out-of-sample event-study over Bitget's own rToken OHLCV.

## Primary finding (robust) — decision quality & risk control
On price-history + technical evidence (no live news/sentiment feed available), **a well-calibrated
agent mostly declines to trade** — and that is the point. Across the scored events the panel issues
articulate, auditable NO_TRADE decisions (e.g. "earnings on the asOf date is a binary gap event;
momentum is a weak predictor of gap direction; stops can't be sized responsibly without gap data —
stand aside"), each carrying a preserved minority opinion. This is the behaviour the Agentic-Trading
track scores as **decision explainability + risk-control effectiveness**. The panel reaches
actionable conviction and takes disciplined positions **only** when the technical structure supports
a direction; the single-LLM baseline, under the identical conviction policy, does not.

## Execution on Bitget (honest constraint)
Bitget lists rTokens **spot-only** (no futures/borrow venue), so the agent's **LONG** decisions are
live-fillable (spot buy) while **SHORT** decisions are emitted as **risk-managed advisory signals**
(`orderResult.status = "advisory"`, reason `SPOT_LONG_ONLY`) — the agent still decides and preserves
dissent, but no short fill is fabricated. The Agentic-Account path is REAL and proven: OAuth connects
the sub-account (uid 8808304094, unified/hedge) and the order call reaches Bitget's trade API; a live
*fill* additionally requires a funded demo/paper account. See `submission/proof.md`.

## Secondary finding (directional-SIGNAL evaluation, NOT significance-tested) — OOS event-study
> This measures the VALUE OF THE PANEL'S CALLS AS SIGNALS (long and short), not Bitget-executed
> strategy returns — short signals are advisory on spot rTokens (above). It is a research backtest.
- Backtest window 2026-03-10 → 2026-10-08; **OOS cutoff 2026-09-08** (≥30d strictly out-of-sample;
  ≥60d/30d-OOS submission bar cleared). Pre-registered, committed before OOS was touched:
  `convictionBar=0.6`, `horizonDays=3` (applied as a transparent CODE policy, never a prompt).
- **Coverage caveat (read this):** of 32 catalyst-events, **20 were dropped by the LLM gateway's
  content-moderation filter** (a tooling artifact of the AgentRouter gateway + deepseek-v4-flash,
  not a modelling choice). **12 events scored (9 IS / 3 OOS).** The exclusions are non-random and
  the OOS sample (3) is far below a meaningful threshold, so **we make NO alpha claim** — the number
  below is directional/illustrative of the mechanism only.
- OOS verdict: **PANEL_BEATS_OOS** (panel OOS avg-P&L > ablation OOS avg-P&L, the pre-registered rule).
- **Panel OOS avg P&L: 0.9952%** (2 SHORT trades, hit-rate 50%, stops set) ·
  **Ablation OOS avg P&L: 0.0000%** (0 positions cleared its own conviction).

## Honesty ledger
- LLM: deepseek-v4-flash via AgentRouter gateway (sponsor Qwen not claimed). Endpoint-agnostic.
- Agentic account CONNECTED via OAuth (uid 8808304094); order path reaches Bitget's trade API.
  No live fill: rTokens are spot-only so shorts are advisory, and a live buy needs a funded
  demo/paper account. Execution presented as paper/advisory — never a fabricated fill. See `submission/proof.md`.
- Full limitations in `LIMITATIONS.md`; threat model in `SECURITY.md`.

## Verify
`npm run verify-claims` (→ `tsx scripts/verify-claims.ts`) → exits 0 iff this file's verdict + OOS
numbers match the value **independently recomputed from the committed per-event rows**; exits 1
(CLAIM_MISMATCH) otherwise.
