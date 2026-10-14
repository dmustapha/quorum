# VERIFY REPORT — PREFLIGHT MODE (re-show track)

```
!!! DEADLINE PASSED — submission verdict capped at DO NOT SUBMIT !!!
Deadline (UTC): 2026-10-11 — source: brief (bitget.md). Now: 2026-10-14.
Context: this is the spec §14 POST-SUBMISSION RE-SHOW track. The frozen showcase was the
on-deadline entry; this rebuild targets Demo Day / People's Choice / portfolio, NOT the closed
submission form. Submission-completeness (F2) + eligibility (F6) are therefore N/A here.
```

```
=======================================
HACKATHON VERIFY — PREFLIGHT (re-show readiness)
Project: Quorum — adversarial-trading research console
Live: https://quorum-ten-mauve.vercel.app
Track fit: Bitget AI × Crypto — AI Trading Desk · Decision stress-testing sub-theme
Run date: 2026-10-14
Kill-Zone Escalation: NONE
=======================================
```

## KILL-ZONES
- KZ-1 Demo Reliability:        CLEAR (5/5 surface runs; live engine proven in prod)
- KZ-2 Submission Completeness: N/A (re-show — no open submission; deadline passed)
- KZ-3 Contract Wrong Network:  N/A (no smart contracts — paper/advisory trading app)
- KZ-4 Sponsor Integration:     CLEAR (Bitget Agent Hub + 0G Compute both real, ABCD pass)
- KZ-5 Eligibility Compliance:  N/A (re-show)
- KZ-6 Claim Integrity:         N/A (inline track, no PULSE VF ledger)
- KZ-7 Infra Durability:        CLEAR (Vercel Pro — not free-tier spin-down; maxDuration=120)

OVERALL (submission): DO NOT SUBMIT — deadline passed (confirm extension to lift).
OVERALL (re-show readiness): STRONG — 65/73 applicable (~89%).

## FACET SCORES (re-show adjusted)
| Facet | Score | Notes |
|---|---|---|
| 1. Demo Reliability | 22/25 | 5/5 primary surfaces (`/`,`/app`,`/scoreboard`,`/browse`) HTTP 200 + scoreboard honest (scored=3) every run. Live 0G panel proven end-to-end in prod. −3: a cold *uncached* catalyst takes ~20–68s and has an occasional empty-completion transient — handled honestly by the fail-card ("the panel couldn't reach a reading, try again"), spec §6, not a crash. |
| 2. Submission Completeness | N/A | Re-show track; no open submission form. |
| 3. Sponsor Integration | 17/20 | **Bitget Agent Hub** (`@bitget-ai/bitget-agent-sdk@3.3.1`, real `placeStrategyOrder` path, honest no-fill for spot-only rTokens) + **0G Compute** (deepseek-v4-pro, the whole debate IS its live output, proven on prod) + Bitget market data (rToken tickers/candles). −3: Agent Hub order path is advisory-only for SHORT (spot-only rTokens, honest); Bitget Playbook not integrated (own backtest used instead). |
| 4. Technical Correctness | 14/15 | Fresh clone from origin (`0401aa6`): `npm install` OK, **104/104 tests**, typecheck clean, production build compiles. Prod deploy live, 0G key provisioned, live engine authenticates. −1: a cold-run latency ceiling (maxDuration=120) is real but within budget. |
| 5. Narrative Quality | 9/10 | One-sentence pitch fills cleanly (below). Problem specific (showcase "only works from cache"); the operator job is concrete; honesty framing (advisory/spot-only, leak-safe scoreboard, pre-registration guard) is a differentiator. |
| 6. Eligibility Compliance | N/A | Re-show. |
| 7. Code Quality | 3/3 | README (213 lines), LICENSE present, no secrets in repo, `.env.local` gitignored + never committed across all commits, fresh-clone build clean. |
| 8. Presentation Assets | N/A | Demo video intentionally left alone this pass (user directive); the on-deadline video belongs to the frozen submission. Spec §14: a fresh demo is end-of-track. |

## WINNING-PATTERN CHECKS (advisory)
- WP-1 Landing: PASS — `/app` loads inside a dense operator console (run box + decision log + scoreboard links), not an empty/login gate.
- WP-2 Test Ratio: PASS — 24 test files over the core logic; UI verified by build + live-smoke (repo convention).
- WP-3 Multi-Track: PASS — fits AI Trading Desk (console/operator) AND Agentic Trading (Judge auto-rules); real code backs both.
- WP-5 README Story: PASS — problem → engine → features → honesty.

## ONE-SENTENCE PITCH
"Quorum lets a trader operate an adversarial Bull/Bear/Risk/Judge panel over tokenized U.S. stocks (Bitget rTokens), running live on 0G decentralized compute, test the judging with a conviction-gate slider, and read an honest calibration scoreboard — so they see not just the call but the best reason it might be wrong, with every stat carrying its n."

## CONFIRMED DEMO FLOW (live, on prod)
1. Land on `/app` → pick a scheduled catalyst → **Run live** → the real 0G debate streams inline (Bull→Bear→Risk→Judge, LIVE lesser-badge, the case against preserved).
2. Open the ruling → drag the conviction-gate slider → the call flips NO_TRADE↔SHORT↔LONG instantly (pure-code re-gate; EXPLORATORY guard off the pinned bar).
3. Browse/compare decisions → Scoreboard: calibration curve + every stat n-gated, sub-threshold greyed, leak-safe (live runs never enter the aggregate).

## ACTION ITEMS
BLOCKED: none (no kill-zones).
RE-SHOW READINESS (address if pursuing Demo Day / People's Choice):
1. Fresh demo video on the rebuilt product (end-of-track per §14) — currently deferred.
2. Cold-start warm-cache prebuild for the landing/popular catalysts (spec §6) so a first-time judge never waits 20–68s on an uncached live run.
3. If re-submitting anywhere: confirm the window is open (Oct-11 form is closed).

=======================================
RECOMMENDATION: RE-SHOW READY (strong). NOT submittable to the closed Oct-11 form.
=======================================
