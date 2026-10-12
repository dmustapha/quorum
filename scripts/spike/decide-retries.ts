// Phase 0 (keep-able). Per-role success over n attempts = 1 - p^n; whole panel needs all `roles`.
export function panelSuccess(p: number, attempts: number, roles: number): number {
  const perRole = 1 - Math.pow(p, attempts);
  return Math.pow(perRole, roles);
}

// Smallest attempt count meeting the whole-panel target against the worst per-role empty-rate.
export function retriesForTarget(worstEmptyRate: number, roles: number, target: number): number {
  for (let n = 1; n <= 10; n++) {
    if (panelSuccess(worstEmptyRate, n, roles) >= target) return n;
  }
  return 10; // cap — if even 10 attempts can't clear the target, the model is unusable as-is
}
