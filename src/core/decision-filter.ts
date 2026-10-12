// File: src/core/decision-filter.ts
// Pure filter + sort over the decision corpus. No side effects, no mutations.
import type { DecisionRecord, Action, EventType } from './types';

export interface DecisionFilter {
  action?: Action;
  token?: string;
  eventType?: EventType;
  minConv?: number;
  sortBy: 'date' | 'conviction' | 'token';
  dir: 'asc' | 'desc';
}

export function filterSort(rows: DecisionRecord[], f: DecisionFilter): DecisionRecord[] {
  const filtered = rows.filter((r) => {
    if (f.action !== undefined && r.verdict.decision.action !== f.action) return false;
    if (f.token !== undefined && f.token !== '' &&
        !r.packet.symbol.toLowerCase().includes(f.token.toLowerCase())) return false;
    if (f.eventType !== undefined && r.packet.eventType !== f.eventType) return false;
    if (f.minConv !== undefined && r.verdict.decision.conviction < f.minConv) return false;
    return true;
  });

  const copy = [...filtered];
  copy.sort((a, b) => {
    let cmp = 0;
    if (f.sortBy === 'date') {
      cmp = a.packet.eventDate.localeCompare(b.packet.eventDate);
    } else if (f.sortBy === 'conviction') {
      cmp = a.verdict.decision.conviction - b.verdict.decision.conviction;
    } else {
      cmp = a.packet.symbol.localeCompare(b.packet.symbol);
    }
    return f.dir === 'desc' ? -cmp : cmp;
  });

  return copy;
}
