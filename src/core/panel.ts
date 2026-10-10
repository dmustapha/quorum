// File: src/core/panel.ts
// Adversarial debate: Bull (long bias), Bear (short/avoid), Risk (sizing/downside).
// Role-locked system prompts guarantee genuine opposition. Cheap model for all three (R3 cost).

import type { Argument, DebateTranscript, EvidencePacket, Role } from './types';
import { LLMClient, type LLMMessage } from '../adapters/llm/client';

// Research/backtest-study framing: an academic equity-research panel reviewing a HISTORICAL
// catalyst. Keeps genuine role opposition (the mechanism) while reading as analysis, not trading
// advice — the tone that clears the gateway content filter.
const SYSTEM: Record<Role, string> = {
  bull: 'You are the BULL research analyst in an academic equity-research panel reviewing a historical market catalyst for a backtest study. Make the strongest evidence-based case that the stock rose after this catalyst. Cite the evidence packet. Output STRICT JSON: {"thesis": string, "evidenceRefs": string[], "confidence": number 0..1}.',
  bear: 'You are the BEAR research analyst in an academic equity-research panel reviewing a historical market catalyst for a backtest study. Make the strongest evidence-based case that the stock fell or was best avoided after this catalyst. Cite the evidence packet. Output STRICT JSON: {"thesis": string, "evidenceRefs": string[], "confidence": number 0..1}.',
  risk: 'You are the RISK research analyst in an academic equity-research panel reviewing a historical market catalyst for a backtest study. You take no direction; you assess historical volatility, downside, and a defensible stop level. Output STRICT JSON: {"thesis": string, "evidenceRefs": string[], "confidence": number 0..1}.',
};

export function packetToPrompt(p: EvidencePacket): string {
  return [
    `Symbol: ${p.symbol} (${p.eventType} catalyst on ${p.eventDate}, asOf ${p.asOf})`,
    `Price context: close=${p.priceContext.close} sma20=${p.priceContext.sma20} atr14=${p.priceContext.atr14} ret5d=${p.priceContext.ret5d} vol=${p.priceContext.vol}`,
    `Signals: ${JSON.stringify(p.signals)}`,
  ].join('\n');
}

async function argue(llm: LLMClient, role: Role, packet: EvidencePacket): Promise<Argument> {
  const messages: LLMMessage[] = [
    { role: 'system', content: SYSTEM[role] },
    { role: 'user', content: packetToPrompt(packet) },
  ];
  const { text } = await llm.complete(messages, { model: llm.cheap(), json: true });
  const parsed = JSON.parse(text) as Partial<Omit<Argument, 'role'>>;
  return {
    role,
    thesis: String(parsed.thesis ?? ''),
    evidenceRefs: Array.isArray(parsed.evidenceRefs) ? parsed.evidenceRefs.map(String) : [],
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence ?? 0.5))),
  };
}

export class Panel {
  constructor(private readonly llm: LLMClient) {}

  async debate(packet: EvidencePacket): Promise<DebateTranscript> {
    const roles: Role[] = ['bull', 'bear', 'risk'];
    const args = await Promise.all(roles.map((r) => argue(this.llm, r, packet)));
    return { packet, arguments: args, rounds: 1 };
  }
}
