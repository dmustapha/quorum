// File: src/app/demo/page.tsx
// Run-a-panel flow, reskinned to the reference system. A cold visitor picks a curated catalyst,
// POSTs /api/run, and sees the live 3-way debate + Verdict Seal + ruling/minority/order. The
// POST flow is unchanged; 503 (LLM_API_KEY unset) and 502 (error) render an honest error state -
// never a fabricated result.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CatalystEvent, DecisionRecord } from '../../core/types';
import { VerdictSeal } from '../_components/verdict-seal';
import { Field } from '../_components/field';
import {
  sealFromRecord,
  verdictChip,
  orderChip,
  dissentRole,
  toPct,
  shortSym,
  ROLE_META,
} from '../_components/seal-data';

const events: CatalystEvent[] = [
  { symbol: 'RAMZNUSDT', eventType: 'macro', date: '2026-09-11', description: 'US CPI release (August data) - scheduled macro print' },
  { symbol: 'RAMZNUSDT', eventType: 'macro', date: '2026-09-16', description: 'FOMC interest-rate decision (September meeting) - scheduled' },
  { symbol: 'RNVDAUSDT', eventType: 'earnings', date: '2026-02-25', description: 'NVIDIA Q4 FY2026 earnings release (after close)' },
  { symbol: 'RMSTRUSDT', eventType: 'macro', date: '2026-09-16', description: 'FOMC interest-rate decision (September meeting) - scheduled' },
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
      if (!res.ok) setError(body?.error ?? `Run failed (HTTP ${res.status})`);
      else setRecord(body as DecisionRecord);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const seal = record ? sealFromRecord(record) : null;
  const vc = record ? verdictChip(record.verdict.decision.action) : null;
  const oc = record ? orderChip(record.orderResult) : null;

  return (
    <section style={{ padding: 'var(--s-6) 0 var(--s-8)' }}>
      <Field glowA={0.2} glowB engrave grain />
      <div className="wrap content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)' }}>
        <div data-reveal>
          <span className="eyebrow">Live · pick a catalyst and run the panel</span>
          <h1 style={{ fontSize: 'var(--t-h1)', margin: 'var(--s-2) 0 var(--s-3)' }}>Run a panel.</h1>
          <p className="lede">
            Replay a real catalyst through the Bull / Bear / Risk debate and the Judge. Verdicts are
            deterministic from the committed candle cache - nothing is fabricated.
          </p>
        </div>

        <div data-reveal>
          <span className="eyebrow">Pick a catalyst</span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 'var(--s-3)',
              marginTop: 'var(--s-3)',
            }}
          >
            {events.map((ev, i) => (
              <button
                key={`${ev.symbol}-${ev.date}-${i}`}
                onClick={() => run(ev)}
                disabled={loading}
                className="card"
                style={{ textAlign: 'left', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
              >
                <span className="v" style={{ borderColor: 'var(--border-strong)' }}>
                  {shortSym(ev.symbol)} · {ev.eventType}
                </span>
                <p style={{ margin: 'var(--s-3) 0 0', fontSize: 13 }} className="dim">
                  {ev.date} - {ev.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <p className="dim mono" style={{ fontSize: 13 }} data-reveal>
            Panel debating…
          </p>
        )}

        {error && (
          <div className="card" style={{ borderColor: 'var(--acc-40)' }} data-reveal>
            <span className="v v-reject">Cannot run the panel</span>
            <p className="dim" style={{ margin: 'var(--s-3) 0 0' }}>{error}</p>
            {error.includes('LLM_API_KEY') && (
              <p className="dim" style={{ margin: 'var(--s-2) 0 0' }}>
                Browse seeded real decisions in the <Link href="/app">decision log</Link> - no key needed to view.
              </p>
            )}
          </div>
        )}

        {record && seal && vc && oc && (
          <>
            {/* debate */}
            <div data-reveal>
              <span className="eyebrow">The panel · three advocates, same evidence</span>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1.2fr .9fr',
                  gap: 'var(--s-4)',
                  marginTop: 'var(--s-4)',
                }}
              >
                {(['bull', 'bear', 'risk'] as const).map((role) => {
                  const a = record.transcript.arguments.find((x) => x.role === role);
                  return (
                    <div className="card" key={role}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={`v ${ROLE_META[role].cls}`}>{ROLE_META[role].title}</span>
                        {a && (
                          <span className="num faint" style={{ fontSize: 12 }}>
                            conf {a.confidence.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 'var(--s-3) 0 0' }}>{a?.thesis ?? '—'}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ruling + minority */}
            <div data-reveal style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-5)' }}>
              <div className="card" style={{ borderColor: 'var(--acc-40)' }}>
                <span className="eyebrow">The ruling · record of verdict</span>
                <div style={{ display: 'flex', gap: 'var(--s-5)', alignItems: 'center', marginTop: 'var(--s-4)' }}>
                  <VerdictSeal {...seal} size={120} label />
                  <div>
                    <span className={`v ${vc.cls}`}>{vc.label}</span>
                    <div className="num" style={{ fontSize: 'var(--t-stat)', color: 'var(--accent-hi)', lineHeight: 1.1 }}>
                      {toPct(record.verdict.decision.conviction)}
                      <span className="faint" style={{ fontSize: 16 }}>
                        {' '}
                        / bar {toPct(record.verdict.convictionBar)}
                      </span>
                    </div>
                    <span className={`v ${oc.cls}`} style={{ marginTop: 8 }}>
                      {oc.label}
                    </span>
                  </div>
                </div>
                <p className="dim" style={{ margin: 'var(--s-4) 0 0' }}>“{record.verdict.rationale}”</p>
              </div>
              <div className="card" style={{ borderColor: 'var(--azure-24)' }}>
                <span className="eyebrow" style={{ color: 'var(--azure)' }}>
                  Minority opinion · preserved, equal standing
                </span>
                <span className={`v ${ROLE_META[dissentRole(record).toLowerCase()].cls}`} style={{ marginTop: 'var(--s-4)' }}>
                  {dissentRole(record)} · preserved dissent
                </span>
                <p style={{ margin: 'var(--s-3) 0 0' }}>“{record.verdict.minorityOpinion}”</p>
                <p className="faint mono" style={{ marginTop: 'var(--s-4)', fontSize: 12 }}>
                  ev {record.evidenceHash.slice(0, 16)}…
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
