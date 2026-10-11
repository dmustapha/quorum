// File: src/app/_components/seal-data.ts
// Pure, deterministic mapping from a REAL DecisionRecord to the Verdict Seal props and the
// verdict/order chip labels used across the reskin. No fabrication: every value is derived from
// the committed record. Shared by server pages and client bits (no React, no Node imports).
import type { DecisionRecord, OrderResult } from '../../core/types';

export type SealVerdict = 'TRADE' | 'NO_TRADE' | 'SHORT' | '';
export type DissentRole = 'BULL' | 'BEAR' | 'RISK';

/** LONG -> TRADE, SHORT -> SHORT, NO_TRADE -> NO_TRADE. */
export function sealVerdict(action: string): SealVerdict {
  if (action === 'LONG') return 'TRADE';
  if (action === 'SHORT') return 'SHORT';
  return 'NO_TRADE';
}

/**
 * Dissent role = the strongest losing advocate, derived honestly from the transcript.
 * - SHORT verdict: the opposing (long) side is BULL -> dissent is the bull argument.
 * - TRADE/LONG verdict: the opposing side is BEAR -> dissent is the bear argument.
 * - NO_TRADE: no side won; the dissent is the most-confident directional advocate that
 *   *would* have traded (max confidence among bull/bear). Deterministic, matches the
 *   committed minorityOpinion text.
 */
export function dissentRole(r: DecisionRecord): DissentRole {
  const args = r.transcript.arguments;
  const conf = (role: string) => args.find((a) => a.role === role)?.confidence ?? 0;
  const action = r.verdict.decision.action;
  if (action === 'SHORT') return 'BULL';
  if (action === 'LONG') return 'BEAR';
  // NO_TRADE: pick the stronger directional advocate.
  return conf('bull') >= conf('bear') ? 'BULL' : 'BEAR';
}

/** conviction 0..1 -> 0..100 for the seal ring. */
export const toPct = (x: number) => Math.round(x * 100);

export interface SealProps {
  conv: number;
  bar: number;
  verdict: SealVerdict;
  dissent: DissentRole;
}

/** Everything the seal needs, from one real record. */
export function sealFromRecord(r: DecisionRecord): SealProps {
  return {
    conv: toPct(r.verdict.decision.conviction),
    bar: toPct(r.verdict.convictionBar),
    verdict: sealVerdict(r.verdict.decision.action),
    dissent: dissentRole(r),
  };
}

/** Strip the USDT suffix for display (RAMZNUSDT -> RAMZN). */
export const shortSym = (sym: string) => sym.replace(/USDT$/, '');

/** Verdict chip: label + .v-* class. */
export function verdictChip(action: string): { label: string; cls: string } {
  if (action === 'LONG') return { label: 'TRADE · LONG', cls: 'v-trade' };
  if (action === 'SHORT') return { label: 'SHORT · ADVISORY', cls: 'v-short' };
  return { label: 'NO_TRADE', cls: 'v-notrade' };
}

/** Order chip from the honest orderResult status. */
export function orderChip(o: OrderResult): { label: string; cls: string } {
  switch (o.status) {
    case 'filled':
      return { label: 'FILLED', cls: 'v-filled' };
    case 'accepted':
      return { label: 'ACCEPTED', cls: 'v-filled' };
    case 'advisory':
      return { label: 'ADVISORY - no order', cls: 'v-short' };
    case 'rejected':
      return { label: 'REJECTED', cls: 'v-reject' };
    default:
      return { label: 'NO ORDER', cls: 'v-notrade' };
  }
}

export const DISSENT_LABEL: Record<DissentRole, string> = {
  BULL: 'BULL',
  BEAR: 'BEAR',
  RISK: 'RISK',
};

/** Role -> .r-* class + display title for an advocate card. */
export const ROLE_META: Record<string, { cls: string; title: string }> = {
  bull: { cls: 'r-bull', title: 'BULL · case for' },
  bear: { cls: 'r-bear', title: 'BEAR · case against' },
  risk: { cls: 'r-risk', title: 'RISK · constraint' },
};
