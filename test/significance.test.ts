import { describe, it, expect } from 'vitest';
import { belowThreshold, caveatFor, SIGNIFICANCE_N } from '../src/core/significance';

describe('significance gate', () => {
  it('threshold is 30 OOS', () => expect(SIGNIFICANCE_N).toBe(30));
  it('n below 30 is sub-threshold', () => { expect(belowThreshold(3)).toBe(true); expect(belowThreshold(30)).toBe(false); });
  it('caveat always carries n and the drop-count inline', () => {
    expect(caveatFor({ n: 2, dropped: 20 })).toMatch(/2\b/);
    expect(caveatFor({ n: 2, dropped: 20 })).toMatch(/20 excluded/);
  });
});
