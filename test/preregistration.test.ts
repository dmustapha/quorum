import { describe, it, expect } from 'vitest';
import { exploratoryState } from '../src/core/preregistration';
import { DEFAULT_CONVICTION_BAR, DEFAULT_HORIZON_DAYS } from '../src/core/types';

describe('exploratoryState (pre-registration honesty gate)', () => {
  it('at the exact pre-registered point: NOT locked, verdict string allowed', () => {
    const s = exploratoryState(DEFAULT_CONVICTION_BAR, DEFAULT_HORIZON_DAYS);
    expect(s.locked).toBe(false);
    expect(s.showVerdictString).toBe(true);
  });
  it('moving the bar off 0.6 locks it and suppresses the verdict string', () => {
    const s = exploratoryState(0.61, 3);
    expect(s.locked).toBe(true);
    expect(s.showVerdictString).toBe(false);
  });
  it('moving the horizon off 3 locks it', () => {
    expect(exploratoryState(0.6, 5).locked).toBe(true);
  });
  it('is float-safe at exactly 0.6', () => {
    expect(exploratoryState(0.3 + 0.3, 3).locked).toBe(false); // 0.3+0.3 === 0.6 is actually true, but guard anyway
  });
});
