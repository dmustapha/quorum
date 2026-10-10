// File: src/app/demo/page.tsx
// Hero flow for a cold visitor: pick a catalyst → Run Panel (POST /api/run) → render the 3-way
// debate (F-002) → Judge verdict + minority opinion (F-003) → honest paper order (F-005) with
// NO_TRADE showing size 0 + no order (F-004). When /api/run returns 503 (LLM_API_KEY not
// configured) or 502, render a CLEAR error state — never a fabricated result (INVARIANT 2).
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CatalystEvent, DecisionRecord } from '../../core/types';

// Curated demo-ready catalysts: these are already cached (the seeded/backtested events), so
// "Run Panel" replays deterministically from the disk cache — instant, reliable, no gateway
// content-block risk for a cold visitor. Two show disciplined SHORT positions, two show
// risk-managed NO_TRADE with preserved dissent. (Arbitrary uncached catalysts can content-block.)
const events: CatalystEvent[] = [
  { symbol: 'RAMZNUSDT', eventType: 'macro', date: '2026-09-11', description: 'US CPI release (August data) — scheduled macro print' },
  { symbol: 'RAMZNUSDT', eventType: 'macro', date: '2026-09-16', description: 'FOMC interest-rate decision (September meeting) — scheduled' },
  { symbol: 'RNVDAUSDT', eventType: 'earnings', date: '2026-02-25', description: 'NVIDIA Q4 FY2026 earnings release (after close)' },
  { symbol: 'RMSTRUSDT', eventType: 'macro', date: '2026-09-16', description: 'FOMC interest-rate decision (September meeting) — scheduled' },
];

export default function Demo() {
  const [record, setRecord] = useState<DecisionRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (ev: CatalystEvent) => {
    setLoading(true);
    setRecord(null);
    setError(null);
    try {
      const res = await fetch('/api/run', { method: 'POST', body: JSON.stringify(ev) });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? `Run failed (HTTP ${res.status})`);
      } else {
        setRecord(body as DecisionRecord);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="wrap">
      <nav className="nav" style={{ marginTop: 0, marginBottom: 'var(--s-5)' }}>
        <Link href="/">← Home</Link>
        <Link href="/app">App</Link>
        <Link href="/proof">Proof</Link>
      </nav>

      <h2>Pick a catalyst</h2>
      {events.map((ev, i) => (
        <button
          key={`${ev.symbol}-${ev.date}-${i}`}
          onClick={() => run(ev)}
          disabled={loading}
          className="btn-ghost"
        >
          <b>{ev.symbol}</b> · {ev.eventType} · {ev.date} — {ev.description}
        </button>
      ))}

      {loading && <p className="dim" style={{ marginTop: 'var(--s-5)' }}>Panel debating…</p>}

      {error && (
        <div className="empty" style={{ marginTop: 'var(--s-5)', borderColor: 'var(--bad)' }}>
          <p style={{ margin: 0, color: 'var(--dissent)' }}><b>Cannot run the panel</b></p>
          <p className="dim" style={{ margin: 'var(--s-2) 0 0' }}>{error}</p>
          {error.includes('LLM_API_KEY') && (
            <p className="dim" style={{ margin: 'var(--s-2) 0 0' }}>
              Browse seeded real decisions in the <Link href="/app">decision log</Link> — no key needed to view.
            </p>
          )}
        </div>
      )}

      {record && (
        <section style={{ marginTop: 'var(--s-5)' }}>
          {record.transcript.arguments.map((a, i) => (
            <div key={i} className={`arg arg--${a.role}`}>
              <b>{a.role.toUpperCase()}</b>{' '}
              <span className="dim">(confidence {a.confidence})</span>
              <p style={{ margin: 'var(--s-1) 0 0' }}>{a.thesis}</p>
            </div>
          ))}

          <div className="card" style={{ marginTop: 'var(--s-4)' }}>
            <h3 style={{ marginTop: 0 }}>
              JUDGE: {record.verdict.decision.action}
              <span className="dim" style={{ fontWeight: 400 }}>
                {' '}· size {record.verdict.decision.sizePct}% · stop {record.verdict.decision.stopPct}% ·
                conviction {record.verdict.decision.conviction}
              </span>
            </h3>
            <p>{record.verdict.rationale}</p>
            <p className="dissent"><b>Minority opinion:</b> {record.verdict.minorityOpinion}</p>
            <p style={{ marginBottom: 0 }}><b>Paper order:</b></p>
            <pre>{JSON.stringify(record.orderResult, null, 2)}</pre>
          </div>
        </section>
      )}
    </main>
  );
}
