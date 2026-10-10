// File: src/app/app/page.tsx
// Primary app surface — rToken universe + catalyst list (static data files) + the REAL decision
// log from the audit store. Honest empty state when no decisions exist yet.
import Link from 'next/link';
import { Audit } from '../../core/audit';
import universe from '../../../data/universe.json';
import catalysts from '../../../data/catalysts.json';
import type { CatalystEvent } from '../../core/types';

export const runtime = 'nodejs';

export default async function App() {
  const records = await new Audit().list();
  const events = catalysts as CatalystEvent[];

  return (
    <main className="wrap">
      <nav className="nav" style={{ marginTop: 0, marginBottom: 'var(--s-5)' }}>
        <Link href="/">← Home</Link>
        <Link href="/demo">Demo</Link>
        <Link href="/backtest">Backtest</Link>
        <Link href="/proof">Proof</Link>
      </nav>

      <h2>rToken universe</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
        {(universe as string[]).map((s) => (
          <span key={s} className="badge">{s}</span>
        ))}
      </div>

      <h2 style={{ marginTop: 'var(--s-6)' }}>Catalysts ({events.length})</h2>
      <div className="card--sub">
        {events.map((ev, i) => (
          <div key={`${ev.symbol}-${ev.date}-${i}`} style={{ padding: 'var(--s-1) 0' }}>
            <span className="badge">{ev.eventType}</span>{' '}
            <b>{ev.symbol}</b> <span className="dim">· {ev.date} — {ev.description}</span>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 'var(--s-6)' }}>Decision log</h2>
      {records.length ? (
        records.map((r) => (
          <Link key={r.id} href={`/app/decision/${r.id}`} className="row-link">
            <span className="dim">{r.ts}</span> · <b>{r.verdict.decision.action}</b>{' '}
            {r.packet.symbol} · conviction {r.verdict.decision.conviction.toFixed(2)}
          </Link>
        ))
      ) : (
        <div className="empty">
          <p style={{ margin: 0 }}>No decisions yet — run the panel from the Demo page.</p>
        </div>
      )}
    </main>
  );
}
