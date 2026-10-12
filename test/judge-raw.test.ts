import { describe, it, expect, vi, afterEach } from 'vitest';
import { Judge } from '../src/core/judge';
import { LLMClient } from '../src/adapters/llm/client';
import type { DebateTranscript } from '../src/core/types';

const TRANSCRIPT: DebateTranscript = {
  packet: {
    symbol: 'RAMZNUSDT', eventDate: '2026-09-11', eventType: 'macro', asOf: '2026-09-08',
    priceContext: { close: 182.4, sma20: 186.1, atr14: 4.2, ret5d: -0.031, vol: 0.28 },
    signals: { macro: 'FOMC held' },
  },
  arguments: [
    { role: 'bull', thesis: 'rebound', evidenceRefs: [], confidence: 0.6 },
    { role: 'bear', thesis: 'downtrend', evidenceRefs: [], confidence: 0.6 },
    { role: 'risk', thesis: 'size small', evidenceRefs: [], confidence: 0.5 },
  ],
  rounds: 1,
};

// Judge returns a LONG with real sizing, but conviction (0.55) is BELOW the 0.6 bar,
// so the gated action is NO_TRADE. judgeRaw must still carry the unclamped LONG sizing.
function stubLLM(content: string) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(
    JSON.stringify({ choices: [{ message: { content } }], usage: {} }), { status: 200 },
  )));
}

describe('Judge judgeRaw', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('stores UNCLAMPED pre-gate sizing even when the bar gates the action to NO_TRADE', async () => {
    stubLLM(JSON.stringify({
      action: 'LONG', sizePct: 3.5, stopPct: 2.0, conviction: 0.55,
      rationale: 'mild edge', minorityOpinion: 'bear: downtrend intact',
    }));
    const v = await new Judge(new LLMClient(), 0.6).judge(TRANSCRIPT);
    // Gated action is NO_TRADE (0.55 < 0.6) and the DISPLAYED decision zeroes size...
    expect(v.decision.action).toBe('NO_TRADE');
    expect(v.decision.sizePct).toBe(0);
    // ...but judgeRaw preserves the model's raw pre-gate numbers for the slider.
    expect(v.judgeRaw.action).toBe('LONG');
    expect(v.judgeRaw.conviction).toBeCloseTo(0.55);
    expect(v.judgeRaw.sizePctRaw).toBeCloseTo(3.5);
    expect(v.judgeRaw.stopPctRaw).toBeCloseTo(2.0);
    expect(v.judgeRaw.caseAgainst).toBe('bear: downtrend intact');
  });
});
