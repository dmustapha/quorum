import { describe, it, expect } from 'vitest';
import { curvePoints } from '../src/core/curve-geometry';
import type { CalibrationBucket } from '../src/core/scoreboard';

const W = 960;
const H = 340;

describe('curvePoints', () => {
  it('(a) skips null-hitRate buckets entirely', () => {
    const buckets: CalibrationBucket[] = [
      { lo: 0.0, hi: 0.1, hitRate: null, n: 0 },
      { lo: 0.1, hi: 0.2, hitRate: 0.5, n: 10 },
    ];
    const pts = curvePoints(buckets, W, H);
    expect(pts.length).toBe(1);
    // the null bucket is not present — no point at y=0 for it
    expect(pts[0].y).not.toBe(H); // y=H would be hitRate=0
  });

  it('(b) all points fall within [0,w]×[0,h]', () => {
    const buckets: CalibrationBucket[] = [
      { lo: 0.0, hi: 0.1, hitRate: 0,   n: 5  },
      { lo: 0.5, hi: 0.6, hitRate: 0.5, n: 20 },
      { lo: 0.9, hi: 1.0, hitRate: 1,   n: 8  },
    ];
    const pts = curvePoints(buckets, W, H);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(W);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(H);
    }
    // hitRate=1 → y=0 (top of chart)
    const top = pts.find((p) => p.y === 0);
    expect(top).toBeDefined();
    // hitRate=0 → y=H (bottom)
    const bottom = pts.find((p) => p.y === H);
    expect(bottom).toBeDefined();
  });

  it('(c) conviction center maps to x correctly', () => {
    const bucket: CalibrationBucket = { lo: 0.6, hi: 0.7, hitRate: 0.65, n: 15 };
    const pts = curvePoints([bucket], W, H);
    expect(pts.length).toBe(1);
    // center = (0.6+0.7)/2 = 0.65; x = 0.65 * W
    expect(pts[0].x).toBeCloseTo(0.65 * W, 5);
  });

  it('returns empty array for all-null bucket list', () => {
    const buckets: CalibrationBucket[] = [
      { lo: 0.0, hi: 0.5, hitRate: null, n: 0 },
      { lo: 0.5, hi: 1.0, hitRate: null, n: 0 },
    ];
    expect(curvePoints(buckets, W, H)).toHaveLength(0);
  });
});
