// Phase 1 honesty render-gate (spec §5.1). The pinned pre-registered point is bar 0.6 / horizon 3d.
// The moment the user moves off it, any aggregate/OOS claim is EXPLORATORY and PANEL_BEATS_OOS is suppressed.
import { DEFAULT_CONVICTION_BAR, DEFAULT_HORIZON_DAYS } from './types';

export function exploratoryState(
  bar: number,
  horizon: number,
): { locked: boolean; showVerdictString: boolean } {
  const atPoint =
    Math.abs(bar - DEFAULT_CONVICTION_BAR) < 1e-9 && horizon === DEFAULT_HORIZON_DAYS;
  return { locked: !atPoint, showVerdictString: atPoint };
}
