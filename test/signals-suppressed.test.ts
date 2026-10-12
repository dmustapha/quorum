import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { DecisionRecord } from '../src/core/types';

const path = fileURLToPath(new URL('../evidence/seed-decisions.jsonl', import.meta.url));

describe('signalsSuppressed on the committed corpus', () => {
  const rows = readFileSync(path, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l) as DecisionRecord);
  it('every committed row carries an explicit boolean signalsSuppressed', () => {
    for (const r of rows) expect(typeof r.signalsSuppressed).toBe('boolean');
  });
  it('seed demo rows are NOT leak-safe (signalsSuppressed=false) — they ran with signals in-packet', () => {
    for (const r of rows) expect(r.signalsSuppressed).toBe(false);
  });
});
