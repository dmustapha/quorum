# Phase 0 Engine Spike — Finding

Date: 2026-10-12 · Model: deepseek-v4-pro · Provider: 0G Compute Router · Samples: N=20/role

## Measured empty-completion rate (cache bypassed, real prompts)
| Role  | valid | empty | error | unparseable | empty-rate |
|-------|-------|-------|-------|-------------|-----------|
| bull  | 20    | 0     | 0     | 0           | 0.00      |
| bear  | 20    | 0     | 0     | 0           | 0.00      |
| risk  | 20    | 0     | 0     | 0           | 0.00      |
| judge | 20    | 0     | 0     | 0           | 0.00      |

Pooled empty-rate: 0.00. (Errors excluded from the rate denominator; see §Review Focus 429 note.)

## Decision
- Worst per-role empty-rate: 0.00.
- Retry count for ≥95% whole-panel success (4 roles): **1** (from `retriesForTarget`).
- Unparseable-but-non-empty rate: 0.00 → Phase 1 **does not** need JSON-repair.
- One-reliable-run proof: ok=true, action=SHORT, conviction=0.66, minorityLen=288 at 1 retry (live on 0G).

## Go / No-Go for Phase 1

**GO:** deepseek-v4-pro clears the bar at n=1 retry per role under the §3.1 per-run deadline. 

All 80 sampled completions across the four-role panel (bull, bear, risk, judge) produced valid, schema-compliant JSON verdicts. Zero empty responses. Zero transport errors. The measured empty-rate of 0.00 meets the Phase-1 gate at the maximum possible margin (0 empties in 80 live samples). A single retry per role is sufficient to achieve ≥95% whole-panel success; the measured live run on the 0G Compute Router confirms the engine is reliable for production panel execution.

**Note:** the retry wrapper (noCache + retry path) is retained in Phase 1; a single spike snapshot at p=0 is not a cross-time guarantee of reliability under future load/time.

## Hands to Phase 1
- retry-on-empty attempts = 1 (per role, sequential, under the hard per-run deadline).
- measured single-attempt latency ≈ 15–20s/analyst role (bull, bear, risk) · 35–45s/judge role → informs the §3.1 deadline + streaming budget.
