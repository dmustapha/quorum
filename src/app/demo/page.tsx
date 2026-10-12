// File: src/app/demo/page.tsx
// Run-a-panel flow. Visitor picks a curated catalyst → streaming debate unfolds progressively.
// Catalyst picker preserved; fire-and-wait replaced by DebateStream SSE consumer.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CatalystEvent } from '../../core/types';
import { Field } from '../_components/field';
import { DebateStream } from '../_components/debate-stream';
import { shortSym } from '../_components/seal-data';

const events: CatalystEvent[] = [
  { symbol: 'RAMZNUSDT', eventType: 'macro', date: '2026-09-11', description: 'US CPI release (August data) - scheduled macro print' },
  { symbol: 'RAMZNUSDT', eventType: 'macro', date: '2026-09-16', description: 'FOMC interest-rate decision (September meeting) - scheduled' },
  { symbol: 'RNVDAUSDT', eventType: 'earnings', date: '2026-02-25', description: 'NVIDIA Q4 FY2026 earnings release (after close)' },
  { symbol: 'RMSTRUSDT', eventType: 'macro', date: '2026-09-16', description: 'FOMC interest-rate decision (September meeting) - scheduled' },
];

export default function Demo() {
  const [selected, setSelected] = useState<CatalystEvent | null>(null);

  return (
    <section style={{ padding: 'var(--s-6) 0 var(--s-8)' }}>
      <Field glowA={0.2} glowB engrave grain />
      <div className="wrap content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)' }}>
        <div data-reveal>
          <span className="eyebrow">Live · pick a catalyst and run the panel</span>
          <h1 style={{ fontSize: 'var(--t-h1)', margin: 'var(--s-2) 0 var(--s-3)' }}>Run a panel.</h1>
          <p className="lede">
            Replay a real catalyst through the Bull / Bear / Risk debate and the Judge. Verdicts are
            deterministic from the committed candle cache — nothing is fabricated.
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
                onClick={() => setSelected(ev)}
                className="card"
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderColor: selected === ev ? 'var(--border-strong)' : undefined,
                  background: selected === ev ? 'var(--s2)' : undefined,
                }}
              >
                <span className="v" style={{ borderColor: 'var(--border-strong)' }}>
                  {shortSym(ev.symbol)} · {ev.eventType}
                </span>
                <p style={{ margin: 'var(--s-3) 0 0', fontSize: 13 }} className="dim">
                  {ev.date} — {ev.description}
                </p>
              </button>
            ))}
          </div>
          <p className="faint" style={{ marginTop: 'var(--s-3)', fontSize: 13 }}>
            No key? Browse seeded decisions in the <Link href="/app">decision log</Link>.
          </p>
        </div>

        {selected && <DebateStream event={selected} />}
      </div>
    </section>
  );
}
