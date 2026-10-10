# USER-ONBOARDING — Quorum

## USER CLASSES

### Hackathon judge / cold visitor
- WHO: a Bitget judge or CT viewer opening the live URL for the first time, no account, no setup.
- GENESIS: arrives at `/` cold, no login, no wallet; first state = fully seeded — the one-liner, a money-shot decision card with a real minority opinion, and 3-5 real prior decisions already visible.
- ONBOARDING: reads the landing in 10s → clicks **Run Panel** on `/demo` → within ~60s watches a live debate, a Judge verdict, and a real paper order; then opens `/backtest` to see the Panel-vs-single-LLM OOS curve and `/proof` to recompute the numbers.
- INTEGRATION: none required of the user — all Bitget/LLM keys are server-side and scoped to paper-trading.

### Builder / evaluator running it locally
- WHO: a developer cloning the repo to reproduce the backtest and run the panel themselves.
- GENESIS: clones repo, copies `.env.example` → `.env`, adds a Bitget Demo key + LLM key; candle cache + catalyst dataset already committed.
- ONBOARDING: `pnpm i && npx @bitget-ai/bitget-agent-installer upgrade-all` → `pnpm backtest` reproduces `BacktestResult` → `pnpm verify-claims` confirms headline numbers → `pnpm dev` runs the UI.
- INTEGRATION: supplies own Demo + LLM keys; everything else is deterministic from committed data.

## COLD-STRANGER GENESIS
A cold stranger with no prior setup reaches the core value — watching four AIs argue and a Judge rule on a real catalyst, then seeing the OOS edge — via the deployed `/demo` and `/backtest` routes, with NO login wall and NO judge-side keys. The server holds the (paper-only) Demo key and the LLM key, rate-limited.

## USER PATH (not the demo's)
- REAL: open live URL → `/demo` → Run Panel → debate → Judge verdict + minority opinion → real paper order → `/backtest` OOS curve → `/proof` recompute.
- DEMO: EQUALS the real path exactly — the judge clicks Run Panel and the live pipeline executes, identical to a real user. No shortcut surface of any kind; no fabricated fills. Seeded decisions on first paint are REAL prior runs committed to `evidence/`, not synthetic.
