// Phase 2 (pure). The §5.3 sub-threshold caveat as a render gate, not prose.
export const SIGNIFICANCE_N = 30;
export const belowThreshold = (n: number): boolean => n < SIGNIFICANCE_N;
export function caveatFor(stat: { n: number; dropped: number }): string {
  const base = `${stat.n} scored · ${stat.dropped} excluded by gateway filter`;
  return belowThreshold(stat.n) ? `${base} — directional illustration, not significance-tested` : base;
}
