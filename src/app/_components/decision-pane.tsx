// File: src/app/_components/decision-pane.tsx
// Renders one decision's ruling + debate for the side-by-side compare view.
// A null record renders a "decision not found" card so the other pane still works.
import type { DecisionRecord, Role } from '../../core/types';
import { VerdictSeal } from './verdict-seal';
import { AdvocateCard } from './advocate-card';
import {
  sealFromRecord,
  verdictChip,
  toPct,
  shortSym,
  ROLE_META,
} from './seal-data';

export function DecisionPane({ record }: { record: DecisionRecord | null }) {
  if (!record) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)', minHeight: 320 }}>
        <span className="eyebrow" style={{ color: 'var(--ink-faint)' }}>decision not found</span>
        <p style={{ margin: 0, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
          No decision matches this id. Check the URL or choose a different id from the browse grid.
        </p>
      </div>
    );
  }

  const d = record.verdict.decision;
  const seal = sealFromRecord(record);
  const vc = verdictChip(d.action);
  const conv = toPct(d.conviction);
  const bar = toPct(record.verdict.convictionBar);
  const cleared = conv >= bar;
  const byRole = Object.fromEntries(record.transcript.arguments.map((a) => [a.role, a]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
      {/* header */}
      <div>
        <span className="eyebrow">{record.id.slice(0, 8)}</span>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'var(--t-h2)', margin: 'var(--s-2) 0 0', color: 'var(--ink)' }}>
          {shortSym(record.packet.symbol)} · {record.packet.eventType}
        </h2>
        <p style={{ margin: 'var(--s-2) 0 0', color: 'var(--ink-faint)', fontSize: 'var(--t-small)' }}>
          {record.ts.slice(0, 10)}
        </p>
      </div>

      {/* ruling */}
      <div className="card" style={{ borderColor: 'var(--acc-40)' }}>
        <span className="eyebrow">The ruling</span>
        <div style={{ display: 'flex', gap: 'var(--s-4)', alignItems: 'center', marginTop: 'var(--s-4)' }}>
          <VerdictSeal {...seal} size={140} label />
          <div>
            <span className={`v ${vc.cls}`}>{vc.label}</span>
            <div className="num" style={{ fontSize: 'var(--t-h2)', color: 'var(--accent-hi)', lineHeight: 1.1, marginTop: 'var(--s-2)' }}>
              {conv}
              <span className="faint" style={{ fontSize: 14 }}> / bar {bar}</span>
            </div>
            <span className={`v ${cleared ? 'v-trade' : 'v-notrade'}`} style={{ marginTop: 8 }}>
              {cleared ? `cleared · ${conv} ≥ ${bar}` : `below bar · ${conv} < ${bar}`}
            </span>
          </div>
        </div>
        <p className="dim" style={{ margin: 'var(--s-4) 0 0', fontSize: 'var(--t-small)' }}>
          "{record.verdict.rationale}"
        </p>
      </div>

      {/* the case against */}
      <div className="card" style={{ borderColor: 'var(--azure-24)' }}>
        <span className="eyebrow" style={{ color: 'var(--azure)' }}>The best reason this call might be wrong</span>
        <p style={{ margin: 'var(--s-3) 0 0' }}>"{record.verdict.minorityOpinion}"</p>
      </div>

      {/* advocate cards */}
      <div>
        <span className="eyebrow">The panel</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)', marginTop: 'var(--s-3)' }}>
          {(['bull', 'bear', 'risk'] as Role[]).map((role) => (
            <AdvocateCard key={role} role={role} arg={byRole[role]} />
          ))}
        </div>
      </div>
    </div>
  );
}
