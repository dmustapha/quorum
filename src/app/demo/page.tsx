// File: src/app/demo/page.tsx
// Hero flow for a cold visitor: pick a catalyst → Run Panel (POST /api/run) → render the 3-way
// debate (F-002) → Judge verdict + minority opinion (F-003) → honest paper order (F-005) with
// NO_TRADE showing size 0 + no order (F-004). When /api/run returns 503 (LLM_API_KEY not
// configured) or 502, render a CLEAR error state — never a fabricated result (INVARIANT 2).
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CatalystEvent, DecisionRecord } from '../../core/types';
import { DecisionCard } from '../_components/decision-card';

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
    <div className="page">
      <div className="page-head">
        <div>
          <p className="page-kicker">live · pick a catalyst and run the panel</p>
          <h1>Run the panel</h1>
          <p className="page-lede">
            Replay a real catalyst through the Bull / Bear / Risk debate and the Judge. Verdicts
            are deterministic from the committed candle cache — nothing is fabricated.
          </p>
        </div>
      </div>

      <div className="sec-h"><h2>Pick a catalyst</h2></div>
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

      {loading && (
        <p className="dim" style={{ marginTop: 'var(--s-5)', fontFamily: 'var(--mono)', fontSize: 13 }}>
          <span className="status-dot" style={{ display: 'inline-block', marginRight: 8, verticalAlign: 'middle' }} />
          Panel debating…
        </p>
      )}

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
        <section style={{ marginTop: 'var(--s-6)' }}>
          <div className="sec-h"><h2>Adversarial counsel</h2></div>
          <div className="counsel">
            {(['bull', 'bear', 'risk'] as const).map((role) => {
              const a = record.transcript.arguments.find((x) => x.role === role);
              if (!a) return null;
              return (
                <div key={role} className={`cpanel ${role}`}>
                  <div className="cpanel-h">
                    <span className="cpanel-role">{role}</span>
                    <div className="cpanel-conf">
                      <span className="cpanel-conf-v">{a.confidence.toFixed(2)}</span>
                      <span className="cpanel-conf-t"><span className="cpanel-conf-f" style={{ width: `${Math.round(a.confidence * 100)}%` }} /></span>
                    </div>
                  </div>
                  <p className="cpanel-thesis">{a.thesis}</p>
                </div>
              );
            })}
          </div>

          <div className="sec-h"><h2>Judge ruling</h2></div>
          <DecisionCard r={record} />
        </section>
      )}
    </div>
  );
}
