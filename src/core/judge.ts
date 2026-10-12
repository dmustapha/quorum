// File: src/core/judge.ts
// Reads the transcript, emits a schema-validated JudgeVerdict. NO_TRADE unless
// conviction >= convictionBar. minorityOpinion is ALWAYS non-empty (INVARIANT 4).
//
// CRITIQUE-FIX (judge error naming): the error thrown after 2 schema-parse failures names the
// ACTUAL failure — `VERDICT_SCHEMA_INVALID: <zod issue>`. A MINORITY-specific error
// (`MINORITY_MISSING`) is reserved for the genuinely-empty-minorityOpinion case, so the two
// failure modes are distinguishable in logs and tests.

import { z } from 'zod';
import type { DebateTranscript, JudgeVerdict } from './types';
import { DEFAULT_CONVICTION_BAR, MAX_SIZE_PCT } from './types';
import { LLMClient, type LLMMessage } from '../adapters/llm/client';

const VerdictSchema = z.object({
  action: z.enum(['LONG', 'SHORT', 'NO_TRADE']),
  sizePct: z.number().min(0).max(MAX_SIZE_PCT),
  stopPct: z.number().min(0).max(50),
  conviction: z.number().min(0).max(1),
  rationale: z.string().min(1),
  minorityOpinion: z.string().min(1), // INVARIANT 4 — dissent never empty
});

// When bar > 0 (live path): the prompt states the gate and the Judge re-enforces it fail-closed.
// When bar <= 0 (bar-free/backtest-study path): the prompt mentions NO bar — it asks only for an
// HONEST conviction 0..1 — and the Judge returns the model's RAW action+conviction unchanged. The
// bar is then applied downstream in CODE (config.convictionBar), removing prompt-anchoring bias.
const SYSTEM = (bar: number): string =>
  bar > 0
    ? `You are the JUDGE. Read the Bull, Bear, and Risk arguments and rule.
Rules you MUST obey:
- If your conviction < ${bar}, action MUST be "NO_TRADE" with sizePct 0.
- If action is LONG or SHORT, sizePct in (0, ${MAX_SIZE_PCT}] and stopPct > 0.
- minorityOpinion MUST restate the strongest LOSING argument (never empty, even for NO_TRADE).
Output STRICT JSON: {"action","sizePct","stopPct","conviction","rationale","minorityOpinion"}.`
    : `You are the JUDGE. Read the Bull, Bear, and Risk arguments and rule.
Rules you MUST obey:
- Report your HONEST conviction as a number 0..1 (no threshold is imposed).
- If action is LONG or SHORT, sizePct in (0, ${MAX_SIZE_PCT}] and stopPct > 0.
- minorityOpinion MUST restate the strongest LOSING argument (never empty, even for NO_TRADE).
Output STRICT JSON: {"action","sizePct","stopPct","conviction","rationale","minorityOpinion"}.`;

export class Judge {
  constructor(
    private readonly llm: LLMClient,
    private readonly convictionBar = DEFAULT_CONVICTION_BAR,
  ) {}

  async judge(transcript: DebateTranscript): Promise<JudgeVerdict> {
    const messages: LLMMessage[] = [
      { role: 'system', content: SYSTEM(this.convictionBar) },
      { role: 'user', content: JSON.stringify(transcript.arguments) },
    ];

    let lastIssue = 'no attempt made';
    for (let attempt = 0; attempt < 2; attempt++) {
      const { text } = await this.llm.complete(messages, { model: this.llm.strong(), json: true });

      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch (e) {
        lastIssue = `invalid JSON: ${String(e)}`;
        continue;
      }

      const parsed = VerdictSchema.safeParse(raw);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        lastIssue = `${issue?.path.join('.') || '(root)'}: ${issue?.message ?? 'schema mismatch'}`;
        // Reserve MINORITY_MISSING for a genuinely empty dissent; distinguish it explicitly.
        if (issue?.path[0] === 'minorityOpinion') {
          lastIssue = `MINORITY_MISSING: minorityOpinion was empty`;
        }
        continue;
      }

      const v = parsed.data;
      // Live path (bar > 0): fail-closed re-enforcement of the conviction gate even if the LLM
      // disobeys (INVARIANT 1). Bar-free path (bar <= 0): return the RAW model action+conviction
      // unchanged so the bar can be applied downstream in CODE from stored evidence (no anchoring).
      const action = this.convictionBar > 0 && v.conviction < this.convictionBar ? 'NO_TRADE' : v.action;
      return {
        decision: {
          action,
          symbol: transcript.packet.symbol,
          sizePct: action === 'NO_TRADE' ? 0 : v.sizePct,
          stopPct: action === 'NO_TRADE' ? 0 : v.stopPct,
          conviction: v.conviction,
        },
        rationale: v.rationale,
        minorityOpinion: v.minorityOpinion,
        convictionBar: this.convictionBar,
        judgeRaw: {
          action: v.action,            // raw, pre-bar
          conviction: v.conviction,
          sizePctRaw: v.sizePct,       // UNCLAMPED — the whole point of the slider
          stopPctRaw: v.stopPct,
          rationale: v.rationale,
          caseAgainst: v.minorityOpinion,
        },
      };
    }

    // 2 failures → escalate with the ACTUAL failure named; never ship a verdict without dissent.
    if (lastIssue.startsWith('MINORITY_MISSING')) throw new Error(lastIssue);
    throw new Error(`VERDICT_SCHEMA_INVALID: ${lastIssue}`);
  }
}
