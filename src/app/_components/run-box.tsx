'use client';
// File: src/app/_components/run-box.tsx
// The operator's live-run entry on the console. Pick a scheduled catalyst → the real 0G panel
// (deepseek-v4-pro) runs live and the debate streams in inline via DebateStream. This is the
// "run box on the console" (spec §6) — the console is operated, not just read. The ~20s latency
// IS the show (spec §5.4); a fresh ruling wears the LIVE lesser-state, never the Verdict Seal.

import { useState } from 'react';
import type { CatalystEvent } from '../../core/types';
import { DebateStream } from './debate-stream';
import { shortSym } from './seal-data';

export function RunBox({ events }: { events: CatalystEvent[] }) {
  const [selected, setSelected] = useState<CatalystEvent | null>(null);

  return (
    <div data-reveal style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: 'var(--s-3)',
        }}
      >
        <div>
          <span className="eyebrow">Operate the panel · run live on 0G</span>
          <h1 style={{ fontSize: 'var(--t-h2)', margin: 'var(--s-2) 0 0' }}>
            Pick a catalyst. Run the real debate.
          </h1>
        </div>
        <span className="faint mono" style={{ fontSize: 12 }}>
          Bull → Bear → Risk → Judge · live, ~20s
        </span>
      </div>

      {/* Active run streams HERE — immediately visible, above the catalog (not buried below it). */}
      {selected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--s-3)' }}>
            <span className="eyebrow">
              Running · {shortSym(selected.symbol)} · {selected.eventType} · {selected.date}
            </span>
            <button
              onClick={() => setSelected(null)}
              className="btn btn-ghost"
              style={{ fontSize: 'var(--t-small)' }}
            >
              Clear
            </button>
          </div>
          <DebateStream key={`${selected.symbol}-${selected.date}`} event={selected} />
        </div>
      )}

      <span className="eyebrow" style={{ marginTop: selected ? 'var(--s-3)' : 0 }}>
        {selected ? 'Run another catalyst' : 'Scheduled catalysts'}
      </span>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--s-3)',
        }}
      >
        {events.map((ev, i) => {
          const active = selected === ev;
          return (
            <button
              key={`${ev.symbol}-${ev.date}-${i}`}
              onClick={() => setSelected(ev)}
              className="card"
              aria-pressed={active}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                borderColor: active ? 'var(--accent-hi)' : undefined,
                background: active ? 'var(--s2)' : undefined,
              }}
            >
              <span className="v" style={{ borderColor: 'var(--border-strong)' }}>
                {shortSym(ev.symbol)} · {ev.eventType}
              </span>
              <p className="dim" style={{ margin: 'var(--s-3) 0 0', fontSize: 13 }}>
                {ev.date} — {ev.description}
              </p>
              <span
                className="mono"
                style={{ display: 'block', marginTop: 'var(--s-3)', fontSize: 12, color: active ? 'var(--accent-hi)' : 'var(--ink-dim)' }}
              >
                {active ? 'running →' : 'Run live →'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
