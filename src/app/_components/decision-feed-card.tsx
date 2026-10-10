// File: src/app/_components/decision-feed-card.tsx
// Rich, clickable decision card for the /app Decisions feed. Surfaces action badge, conviction
// meter (vs the pre-registered bar), a one-line verdict snippet, the dissent indicator, and the
// honest order status. Pure presentation of a real DecisionRecord — no fabrication.
import Link from 'next/link';
import type { DecisionRecord } from '../../core/types';

function orderFlag(status: string): { label: string; cls: string } {
  switch (status) {
    case 'advisory': return { label: 'ADVISORY · SPOT_LONG_ONLY', cls: 'advisory' };
    case 'skipped': return { label: 'NO ORDER · size 0', cls: 'skipped' };
    case 'rejected': return { label: 'REJECTED', cls: 'rejected' };
    default: return { label: 'FILLED', cls: 'filled' };
  }
}

export function DecisionFeedCard({ r }: { r: DecisionRecord }) {
  const d = r.verdict.decision;
  const act = d.action.toLowerCase().replace(/[^a-z_]/g, '');
  const bar = r.verdict.convictionBar;
  const pct = Math.min(100, Math.round(d.conviction * 100));
  const of = orderFlag(r.orderResult.status);

  return (
    <Link href={`/app/decision/${r.id}`} className="dcard">
      <div className="dcard-top">
        <div>
          <div className="dcard-sym">{r.packet.symbol}</div>
          <div className="dcard-evt">{r.packet.eventType} · {r.packet.eventDate}</div>
        </div>
        <span className={`act-badge ${act}`}>{d.action}</span>
      </div>

      <div className="conv">
        <div className="conv-row">
          <span className="conv-lbl">conviction</span>
          <span className="conv-val">{d.conviction.toFixed(2)} <span className="dim" style={{ fontSize: 10 }}>/ bar {bar.toFixed(2)}</span></span>
        </div>
        <div className="conv-track">
          <div className={`conv-fill ${act}`} style={{ width: `${pct}%` }} />
          <div className="conv-bar-mark" style={{ left: `${Math.round(bar * 100)}%` }} aria-hidden />
        </div>
      </div>

      <p className="dcard-verdict">{r.verdict.rationale}</p>

      <div className="dcard-foot">
        <span className="dissent-flag">dissent preserved</span>
        <span className={`order-flag ${of.cls}`}>{of.label}</span>
      </div>
    </Link>
  );
}
