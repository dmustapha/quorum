import type { StreamEvent, Argument, DecisionRecord, EvidencePacket, JudgeVerdict } from '../../core/types';

export type StreamPhase = 'idle' | 'collecting' | 'debating' | 'ruling' | 'done' | 'failed';
export interface StreamState {
  phase: StreamPhase;
  packet?: EvidencePacket;
  args: { bull?: Argument; bear?: Argument; risk?: Argument };
  verdict?: JudgeVerdict;
  record?: DecisionRecord;
  error?: string;
}
export const initialStreamState = (): StreamState => ({ phase: 'idle', args: {} });

export function reduceStream(s: StreamState, ev: StreamEvent): StreamState {
  switch (ev.type) {
    case 'evidence_ready': return { ...s, phase: 'debating', packet: ev.packet };
    case 'bull_done': return { ...s, phase: 'debating', args: { ...s.args, bull: ev.arg } };
    case 'bear_done': return { ...s, phase: 'debating', args: { ...s.args, bear: ev.arg } };
    case 'risk_done': return { ...s, phase: 'debating', args: { ...s.args, risk: ev.arg } };
    case 'judge_ruling': return { ...s, phase: 'ruling', verdict: ev.verdict };
    case 'order_placed': return s;
    case 'done': return { ...s, phase: 'done', record: ev.record };
    case 'error': return { ...s, phase: 'failed', error: ev.message };
    default: return s;
  }
}
