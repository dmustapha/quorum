import { describe, it, expect } from 'vitest';
import { retriesForTarget, panelSuccess } from '../scripts/spike/decide-retries';

describe('retriesForTarget', () => {
  it('p=0.15, 4 roles, target 0.95 → 3 attempts clears (~0.987 panel success)', () => {
    expect(retriesForTarget(0.15, 4, 0.95)).toBe(3);
    expect(panelSuccess(0.15, 3, 4)).toBeGreaterThan(0.95);
  });
  it('p=0.30, 4 roles, target 0.95 → 3 attempts is NOT enough, needs 4', () => {
    expect(panelSuccess(0.30, 3, 4)).toBeLessThan(0.95); // ~0.896
    expect(retriesForTarget(0.30, 4, 0.95)).toBe(4);
  });
  it('p=0 → 1 attempt suffices', () => {
    expect(retriesForTarget(0, 4, 0.95)).toBe(1);
  });
});
