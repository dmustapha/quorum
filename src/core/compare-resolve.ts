// File: src/core/compare-resolve.ts
// Pure id-resolve helper: finds two DecisionRecords by id from a flat list.
// Never throws on missing ids or empty records — missing id yields null for that side.
import type { DecisionRecord } from './types';

export function resolvePair(
  records: DecisionRecord[],
  a?: string,
  b?: string,
): { a: DecisionRecord | null; b: DecisionRecord | null } {
  const find = (id?: string): DecisionRecord | null => {
    if (!id) return null;
    return records.find((r) => r.id === id) ?? null;
  };
  return { a: find(a), b: find(b) };
}
