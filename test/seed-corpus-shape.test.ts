import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { DecisionRecord } from '../src/core/types';

const path = fileURLToPath(new URL('../evidence/seed-decisions.jsonl', import.meta.url));

describe('committed seed corpus', () => {
  const rows = readFileSync(path, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l) as DecisionRecord);

  it('is non-empty', () => expect(rows.length).toBeGreaterThan(0));

  it('every record carries judgeRaw with unclamped sizing fields', () => {
    for (const r of rows) {
      expect(r.verdict.judgeRaw).toBeTruthy();
      expect(typeof r.verdict.judgeRaw.conviction).toBe('number');
      expect(typeof r.verdict.judgeRaw.sizePctRaw).toBe('number');
      expect(r.verdict.judgeRaw.caseAgainst.length).toBeGreaterThan(0); // dissent preserved
    }
  });

  it('every record carries forwardReturns at the 4 horizons (value or null, never missing)', () => {
    for (const r of rows) {
      expect(r.forwardReturns).toBeTruthy();
      for (const h of ['1', '3', '5', '10']) expect(h in (r.forwardReturns ?? {})).toBe(true);
    }
  });
});
