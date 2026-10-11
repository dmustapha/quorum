// File: src/app/_components/decision-docket.tsx
// The DECISION LOG (.docket) — one row per REAL decision, mini Verdict Seal per row. Rows are
// keyboard-accessible links (role=link, tabIndex 0, Enter/Space -> navigate). Client component
// because rows navigate via the router on click/keydown.
'use client';

import { useRouter } from 'next/navigation';
import { VerdictSeal } from './verdict-seal';
import {
  sealFromRecord,
  verdictChip,
  orderChip,
  dissentRole,
  shortSym,
  toPct,
} from './seal-data';
import type { DecisionRecord } from '../../core/types';

export function DecisionDocket({ records }: { records: DecisionRecord[] }) {
  const router = useRouter();
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: 'var(--s-4)' }}>
      <table className="docket">
        <thead>
          <tr>
            <th>ID</th>
            <th>rToken</th>
            <th>Catalyst</th>
            <th>As-of</th>
            <th>Seal</th>
            <th>Verdict</th>
            <th>Conviction</th>
            <th>Dissent</th>
            <th>Order</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const seal = sealFromRecord(r);
            const vc = verdictChip(r.verdict.decision.action);
            const oc = orderChip(r.orderResult);
            const dis = dissentRole(r);
            const href = `/app/decision/${r.id}`;
            const go = () => router.push(href);
            return (
              <tr
                key={r.id}
                role="link"
                tabIndex={0}
                aria-label={`Open audit for ${shortSym(r.packet.symbol)}, verdict ${vc.label}`}
                onClick={go}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    go();
                  }
                }}
              >
                <td className="num" style={{ color: 'var(--ink)' }}>
                  {r.id.slice(0, 8)}
                </td>
                <td className="mono" style={{ color: 'var(--ink)' }}>
                  {shortSym(r.packet.symbol)}
                </td>
                <td className="faint mono" style={{ fontSize: 12 }}>
                  {r.packet.eventType}
                </td>
                <td className="num faint" style={{ fontSize: 12 }}>
                  {r.packet.asOf}
                </td>
                <td>
                  <VerdictSeal {...seal} size={34} />
                </td>
                <td>
                  <span className={`v ${vc.cls}`}>{vc.label}</span>
                </td>
                <td className="num" style={{ color: 'var(--ink)' }}>
                  {toPct(r.verdict.decision.conviction)} / {toPct(r.verdict.convictionBar)}
                </td>
                <td className="mono faint" style={{ fontSize: 12 }}>
                  {dis}
                </td>
                <td>
                  <span className={`v ${oc.cls}`}>{oc.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
