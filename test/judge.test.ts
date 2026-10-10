import { describe, it, expect } from 'vitest';
import { Judge } from '../src/core/judge';
import type { LLMClient, LLMMessage, CompleteOpts, CompleteResult } from '../src/adapters/llm/client';
import type { DebateTranscript, EvidencePacket } from '../src/core/types';

// Fake LLM: returns a scripted queue of responses. ZERO network.
class FakeLLM {
  private queue: string[];
  calls = 0;
  constructor(responses: string[]) { this.queue = responses; }
  async complete(_m: LLMMessage[], _o: CompleteOpts = {}): Promise<CompleteResult> {
    this.calls++;
    return { text: this.queue.shift() ?? '{}' };
  }
  cheap() { return 'cheap'; }
  strong() { return 'strong'; }
}

const asLLM = (f: FakeLLM) => f as unknown as LLMClient;

const packet: EvidencePacket = {
  symbol: 'RNVDAUSDT', eventDate: '2026-02-25', eventType: 'earnings',
  priceContext: { close: 180, sma20: 175, atr14: 6, ret5d: 0.03, vol: 1e6 },
  signals: {}, asOf: '2026-02-25',
};
const transcript: DebateTranscript = {
  packet,
  arguments: [
    { role: 'bull', thesis: 'beat likely', evidenceRefs: ['ret5d'], confidence: 0.7 },
    { role: 'bear', thesis: 'priced in', evidenceRefs: ['sma20'], confidence: 0.4 },
    { role: 'risk', thesis: 'cap at 5%', evidenceRefs: ['atr14'], confidence: 0.5 },
  ],
  rounds: 1,
};

describe('Judge', () => {
  // HAPPY: above-bar LONG verdict with non-empty dissent.
  it('returns a LONG verdict above the bar and preserves non-empty minorityOpinion', async () => {
    const llm = new FakeLLM([JSON.stringify({
      action: 'LONG', sizePct: 5, stopPct: 8, conviction: 0.8,
      rationale: 'bull case strongest', minorityOpinion: 'bear: already priced in',
    })]);
    const v = await new Judge(asLLM(llm), 0.6).judge(transcript);
    expect(v.decision.action).toBe('LONG');
    expect(v.decision.sizePct).toBe(5);
    // INVARIANT 4 — dissent is never empty.
    expect(v.minorityOpinion.length).toBeGreaterThan(0);
  });

  // EDGE: conviction below the bar is forced to NO_TRADE with size 0, dissent still present.
  it('forces NO_TRADE with size 0 when conviction < bar (fail-closed gate)', async () => {
    const llm = new FakeLLM([JSON.stringify({
      action: 'LONG', sizePct: 9, stopPct: 10, conviction: 0.3,
      rationale: 'weak', minorityOpinion: 'bear dominates',
    })]);
    const v = await new Judge(asLLM(llm), 0.6).judge(transcript);
    expect(v.decision.action).toBe('NO_TRADE');
    expect(v.decision.sizePct).toBe(0);
    expect(v.minorityOpinion.length).toBeGreaterThan(0);
  });

  // ERROR (critique-fix): an empty minorityOpinion twice → MINORITY_MISSING, not a blanket error.
  it('throws MINORITY_MISSING when minorityOpinion is empty after 2 attempts', async () => {
    const bad = JSON.stringify({
      action: 'LONG', sizePct: 5, stopPct: 8, conviction: 0.8,
      rationale: 'ok', minorityOpinion: '',
    });
    const llm = new FakeLLM([bad, bad]);
    await expect(new Judge(asLLM(llm), 0.6).judge(transcript)).rejects.toThrow(/MINORITY_MISSING/);
  });

  // ERROR (critique-fix): a non-minority schema failure names VERDICT_SCHEMA_INVALID, not MINORITY.
  it('throws VERDICT_SCHEMA_INVALID naming the real issue (not MINORITY_MISSING)', async () => {
    const bad = JSON.stringify({
      action: 'MAYBE', sizePct: 5, stopPct: 8, conviction: 0.8,
      rationale: 'ok', minorityOpinion: 'bear view',
    });
    const llm = new FakeLLM([bad, bad]);
    await expect(new Judge(asLLM(llm), 0.6).judge(transcript))
      .rejects.toThrow(/VERDICT_SCHEMA_INVALID/);
  });
});
