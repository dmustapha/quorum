# SECURITY — Quorum

Threat model for the autonomous Bull/Bear/Risk → Judge → paper-order pipeline.
Enforcement is structural (types + single code paths), not comment-level.

## Threat matrix
| Threat | Enforcement | File |
|--------|-------------|------|
| Order fired without a Judge verdict | Executor takes `JudgeVerdict` only; no loose `placeOrder(symbol,side,size)` surface anywhere | src/core/executor.ts |
| Fabricated fill presented as real | raw SDK response or explicit `{status:'rejected'}`; no substitute/mock fill | src/adapters/bitget/agenthub.ts |
| OOS data leakage into fit | `asOf` cutoff slice + IS/OOS partition before aggregation | src/pipeline/collector.ts, src/core/backtest.ts |
| Secret on disk / in repo | keys via env only; `.env` gitignored; no key needed for candles/signal | .env (gitignored) |
| Verdict without dissent | zod requires non-empty `minorityOpinion` | src/core/judge.ts |
| Claim not backed by committed evidence | independent recompute from raw event rows, refuses read-back | scripts/verify-claims.ts |

## Not defended against
- Mainnet / real-money execution (out of scope — paper only; `BITGET_PAPER_TRADING=true`).
- Adversarial LLM prompt-injection via signal text (signals are advisory, not executable; never parsed into orders).
- Market manipulation / microstructure attacks (out of scope).
- Bitget public-API downtime (degrades to committed cache; no synthetic candles).
