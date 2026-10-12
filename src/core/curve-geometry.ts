// Pure geometry helper — no React, no SVG deps. Testable in isolation.
import type { CalibrationBucket } from './scoreboard';

export function curvePoints(
  buckets: CalibrationBucket[],
  w: number,
  h: number,
): { x: number; y: number; n: number }[] {
  return buckets
    .filter((b) => b.hitRate !== null)
    .map((b) => ({
      x: ((b.lo + b.hi) / 2) * w,
      y: h - (b.hitRate as number) * h,
      n: b.n,
    }));
}
