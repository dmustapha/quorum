# Submission status
_Last updated: forge (seed — build keeps this current each phase)_

## Status
- [x] Market data client + committed candle cache (D0 / P0) — 9 symbols, 300 candles each, ~335d depth
- [x] Catalyst calendar dataset committed (D0 / P0) — 24 events (17 earnings + 7 macro), all < 2026-10-09
- [x] Franchise skeleton: CLAIMS.md, scripts/verify-claims.ts, SECURITY.md, honesty ledger, docs/pipeline/claims.json (D0, C0 / P0)
- [ ] LLM client + Panel + Judge + Executor — live single-catalyst run → real paper order (D1)
- [ ] Audit store (D1)
- [ ] Backtest harness + single-LLM ablation + recompute-verifier (D1.5)
- [ ] Seed script real pre-run → evidence/seed-decisions.jsonl (D1.5)
- [ ] Frontend routes /, /app, /app/decision/[id], /backtest, /demo, /proof (D2)
- [ ] Deployed (stateful worker + frontend), hero flow works cold (D2)
- [ ] Demo video + X thread + README + submission form (D2)

## Honesty ledger — known limitations / blockers
- Package names in ARCHITECTURE (`bitget-agent-sdk`, `bitget-signal`, bare) are 404 on npm. RESOLVED at P0.2: the real packages are SCOPED — `@bitget-ai/bitget-agent-sdk@3.3.1` (exposes a `strategy_order` composite tool + `paperTrading` flag; ships as a transitive dep of `@bitget-ai/bitget-agent-mcp`) and `@bitget-ai/bitget-signal@1.2.0`. P1 adapters MUST import the scoped names. Exact `strategy_order` arg signature still to be pinned from the installed `.d.ts` at the D1 executor spike (DT-4).
- LLM endpoint + model ids not yet pinned. Reason: blocked-on sponsor credits (D-6).
- LLM endpoint + model ids not yet pinned. Reason: blocked-on sponsor credits (D-6).
- Paper trading only; no live money. Reason: scope/safety (ADR-002).
- Backtest verdict (PANEL_BEATS_OOS vs PANEL_LOSES_OOS) unknown until run. Reason: empirical — whichever is true ships (INVARIANT 5).
