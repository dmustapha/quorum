// File: src/app/_components/advocate-card.tsx
// Single source of truth for the advocate card used across the streaming debate view.
import type { Role, Argument } from '../../core/types';
import { ROLE_META } from './seal-data';

export function AdvocateCard({ role, arg, pending }: { role: Role; arg?: Argument; pending?: boolean }) {
  if (pending && !arg) {
    return (
      <div className="card stage-pending">
        <span className={`v ${ROLE_META[role].cls}`}>{ROLE_META[role].title}</span>
        <p style={{ margin: 'var(--s-3) 0 0', color: 'var(--ink-faint)', fontStyle: 'italic', fontSize: 13 }}>
          awaiting the {role} analyst…
        </p>
      </div>
    );
  }

  return (
    <div className="card stage">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className={`v ${ROLE_META[role].cls}`}>{ROLE_META[role].title}</span>
        {arg && (
          <span className="num faint" style={{ fontSize: 12 }}>
            conf {arg.confidence.toFixed(2)}
          </span>
        )}
      </div>
      <p style={{ margin: 'var(--s-3) 0 0' }}>{arg?.thesis ?? '—'}</p>
    </div>
  );
}
