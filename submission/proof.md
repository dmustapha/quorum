# Proof — Quorum / Voir Dire

## Independent recompute (anti-theater gate)
`npm run verify-claims` re-derives the OOS verdict FROM the committed per-event rows
(`evidence/backtest-events.jsonl`), never from the stored result. Output:

```
OK: PANEL_BEATS_OOS — panel OOS avg 0.995% (hit 50.0%) vs ablation 0.000% (hit 0.0%), independently recomputed from 12 committed event rows.
```

## OOS event-study (committed)
- `evidence/backtest-result.json` — aggregated BacktestResult (both arms × IS/OOS).
- `evidence/backtest-events.jsonl` — 12 raw per-event rows (the recompute source).
- `evidence/backtest-skipped.json` — 20 events dropped by the LLM-gateway content filter (disclosed).
- `evidence/conviction-distribution.json` — raw bar-free conviction distribution per arm.
- Verdict: **PANEL_BEATS_OOS** — panel OOS avg **0.9952%** (2 SHORTs, hit 50%) vs ablation **0.0000%**.
  Directional only — 3 OOS events, non-random exclusions, NOT significance-tested (see CLAIMS.md / LIMITATIONS.md).

## Real decisions (committed cold-start)
`evidence/seed-decisions.jsonl` — 4 real panel decisions (debate → judge → preserved dissent → audit),
each with an evidenceHash tying the verdict to its exact inputs (re-hash reproduces it):

```
RAMZNUSDT 2026-09-11 c5c57bd2c9e68c07
RAMZNUSDT 2026-09-16 e87fdc37f42f5981
RNVDAUSDT 2026-02-25 977e2a084a6ac681
RMSTRUSDT 2026-09-16 034d48627732b0fb
```

- 2 disciplined SHORT decisions (stops set) + 2 articulate NO_TRADE (binary-event risk control).
- Every verdict carries a non-empty minority opinion (INVARIANT 4).

## Bitget Agent Hub integration (proven connection + wired path)
- **OAuth connected** to a real Agentic sub-account — **uid 8808304094**, unified/hedge mode
  (`get_auth_status` → authorized; credential at `~/.bitget/oauth_token.json`).
- **Order path reaches Bitget's trade API** — authenticated `callOperation` hits the live v3
  endpoint (account-settings read OK; a placeOrder call reached Bitget and returned a
  parameter-level response — auth + routing work end-to-end, not a credential failure).

## Order execution (honest, refined-C)
- **LONG** decisions are live-fillable (spot buy) — would carry a real orderId with a funded demo/paper account.
- **SHORT** decisions → `orderResult.status = "advisory"` (reason `SPOT_LONG_ONLY`): Bitget lists
  rTokens spot-only, so a short cannot be filled anywhere on Bitget. The agent still DECIDES and
  preserves dissent; **no fill is ever fabricated** (INVARIANT 2). Seeded decisions reflect this —
  the two SHORT calls are `advisory`, the two NO_TRADE are `skipped`.
- No live fill in this submission (the OAuth key is the live account, unfunded; paper trading needs
  a demo key). Execution is presented as paper/advisory; the integration is proven at the
  connection + path level.

## LLM
deepseek-v4-flash via AgentRouter gateway (OpenAI-compatible). Endpoint-agnostic — one `.env` swap
to the sponsor Qwen (`qwen3.8-max`) when claimed.
