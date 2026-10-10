// File: src/app/app/page.tsx
// Decisions feed — the primary app surface. A responsive GRID of rich DECISION CARDS from the
// REAL audit store (seed + live), with a compact catalyst-browse rail alongside. Honest empty
// state when no decisions exist. No data fabrication — audit.list() is the only source.
import { Audit } from '../../core/audit';
import catalysts from '../../../data/catalysts.json';
import type { CatalystEvent } from '../../core/types';
import { DecisionFeedCard } from '../_components/decision-feed-card';

export const runtime = 'nodejs';

export default async function App() {
  const records = await new Audit().list();
  const events = catalysts as CatalystEvent[];
  const ordered = [...records].reverse(); // newest first

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="page-kicker">adversarial panel → judge → audited record</p>
          <h1>Decisions</h1>
          <p className="page-lede">
            Every committed verdict. Bull, Bear and Risk argue a real catalyst; the Judge rules
            and the losing argument is kept on the record — never erased.
          </p>
        </div>
        <div className="stats" style={{ gridTemplateColumns: 'repeat(2, minmax(110px,1fr))', minWidth: 240 }}>
          <div className="stat">
            <div className="stat-lbl">decisions</div>
            <div className="stat-val">{records.length}</div>
          </div>
          <div className="stat">
            <div className="stat-lbl">dissents kept</div>
            <div className="stat-val lime">{records.length}</div>
            <div className="stat-sub">1 per verdict</div>
          </div>
        </div>
      </div>

      <div className="app-grid">
        <section>
          <div className="sec-h">
            <h2>Committed verdicts</h2>
            <span className="sec-meta">{ordered.length} on the record</span>
          </div>
          {ordered.length ? (
            <div className="feed">
              {ordered.map((r) => (
                <DecisionFeedCard key={r.id} r={r} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <p style={{ margin: 0 }}>No decisions yet — run the panel from the Demo page.</p>
            </div>
          )}
        </section>

        <aside>
          <div className="sec-h"><h2>Catalyst calendar</h2></div>
          <div className="browse">
            <div className="browse-h">
              <span>scheduled events</span>
              <span>{events.length}</span>
            </div>
            <div className="browse-list">
              {events.map((ev, i) => (
                <div key={`${ev.symbol}-${ev.date}-${i}`} className="browse-item">
                  <b>{ev.symbol.replace('USDT', '')}</b>{' '}
                  <span className="browse-tag">{ev.eventType}</span>{' '}
                  <span className="d">· {ev.date}</span>
                  <div className="d" style={{ marginTop: 2, whiteSpace: 'normal' }}>{ev.description}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
