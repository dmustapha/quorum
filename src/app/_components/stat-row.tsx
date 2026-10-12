// Server-safe component. No 'use client'.
import type { Stat } from '../../core/scoreboard';
import { belowThreshold, caveatFor } from '../../core/significance';

interface StatRowProps {
  label: string;
  stat: Stat;
  loud?: boolean;
}

function formatRate(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export function StatRow({ label, stat, loud }: StatRowProps) {
  const below = belowThreshold(stat.n);
  const caveat = caveatFor(stat);

  if (stat.n === 0) {
    return (
      <div className="stat-row">
        <span className="stat-row-label">{label}</span>
        <span className="stat-row-value stat-subthreshold">no scored decisions yet</span>
      </div>
    );
  }

  return (
    <div className="stat-row">
      <span className="stat-row-label">{label}</span>
      <span className={`stat-row-value${below ? ' stat-subthreshold' : ''}`}>
        {formatRate(stat.value)}
        <span className={`stat-row-caveat${loud ? ' stat-row-caveat--loud' : ''}`}>{caveat}</span>
      </span>
    </div>
  );
}
