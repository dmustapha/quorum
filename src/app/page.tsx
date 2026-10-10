// File: src/app/page.tsx
// Landing — server component reading the REAL audit store. Shows the latest real decision as the
// money-shot (DecisionCard surfaces minority opinion + honest order), or an honest empty state
// when no decisions exist yet (P2 seed not run / key-blocked). No fabricated hero.
import Link from 'next/link';
import { Audit } from '../core/audit';
import { DecisionCard } from './_components/decision-card';

export const runtime = 'nodejs';

export default async function Landing() {
  const records = await new Audit().list();
  const hero = records[records.length - 1];

  return (
    <main className="wrap">
      <p className="mono dim" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 'var(--s-4)' }}>
        QUORUM_ · adversarial panel → judge → audited record
      </p>
      <h1 style={{ marginBottom: 'var(--s-3)' }}>The AI trading floor that argues before it trades.</h1>
      <p className="dim" style={{ fontSize: 17, maxWidth: 560 }}>
        Four AIs argue each catalyst trade; a Judge rules and keeps the dissent on the record.
      </p>
      <Link href="/demo" className="btn" style={{ marginTop: 'var(--s-4)', display: 'inline-block' }}>Run Panel →</Link>

      {hero ? (
        <DecisionCard r={hero} />
      ) : (
        <section className="empty" style={{ marginTop: 'var(--s-5)' }}>
          <p style={{ margin: 0 }}>No decisions yet — run the panel to produce the first verdict.</p>
          <p className="dim" style={{ margin: 'var(--s-2) 0 0' }}>
            Minority opinion and the paper order appear here once a real decision exists.
          </p>
        </section>
      )}

      <nav className="nav">
        <Link href="/app">App</Link>
        <Link href="/backtest">Backtest</Link>
        <Link href="/demo">Demo</Link>
        <Link href="/proof">Proof</Link>
      </nav>
    </main>
  );
}
