# ROUTE-ARCHITECTURE — Quorum

## ROUTES
- / (landing) — opening beat: "The AI trading floor that argues before it trades." Money-shot decision card + one-liner + Run Panel CTA.
- /app — primary app: rToken universe, catalyst list, decision log (seeded).
- /app/decision/[id] — sub-route: full audit of one decision (evidence packet, 3 analyst arguments, Judge rationale, conviction, minority opinion, paper order response).
- /backtest — the OOS event-study: Panel vs single-LLM equity curves + IS/OOS metrics table + strict cutoff date.
- /demo — separate judge/demo route: the single-click hero flow (pick catalyst, Run Panel, debate stream, verdict, paper order), optimized for a cold visitor.
- /proof — recompute-verifier output, Bitget Demo order ids, evidence hashes, honest verdict line.

`routeArchitecture.multiPageRequired: true` — 2 user classes (judge/cold visitor + builder) and a distinct audit surface mandate multi-page; no single-page cram. Landing REQUIRED and present.

## FIRST-CONTACT
- 30-sec legibility: landing states in one line "Four AIs argue each catalyst trade; a Judge rules and keeps the dissent."
- money-shot: a real Judge decision card with direction + size + stop + conviction and a visible minority-opinion block (hero visual on `/`).
- liveness/cold-start: 3-5 seeded real decisions + the Panel-vs-ablation curve render immediately — no empty state.
- honesty: `/proof` carries the recompute-verifier diff and the real OOS verdict (incl. the honest finding if the panel loses); status/limitations linked from the footer (SUBMISSION_STATUS.md).
- entry-funnel: single hero CTA = **Run Panel** (lands on `/demo`).
