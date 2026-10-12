'use client';
// File: src/app/_components/tune-gate.tsx
// §5.1 Tune-the-gate: re-derives ONE stored ruling instantly in pure code (no LLM, no fetch).
// Honest framing: this is arithmetic on a stored ruling — NOT a new panel session.
import { useState } from 'react';
import type { DecisionRecord } from '../../core/types';
import { DEFAULT_CONVICTION_BAR, DEFAULT_HORIZON_DAYS } from '../../core/types';
import { applyBar, flipPoint, realizedOutcome } from '../../core/regate';
import { VerdictSeal } from './verdict-seal';
import { verdictChip, toPct, sealVerdict, dissentRole } from './seal-data';

const HORIZONS = [1, 3, 5, 10] as const;
type Horizon = (typeof HORIZONS)[number];

export function TuneGate({ record }: { record: DecisionRecord }) {
  const [bar, setBar] = useState(DEFAULT_CONVICTION_BAR);
  const [horizon, setHorizon] = useState<Horizon>(DEFAULT_HORIZON_DAYS as Horizon);

  // Pure re-gate — instant, no spinner
  const g = applyBar(record.verdict.judgeRaw, bar);
  const fp = flipPoint(record.verdict.judgeRaw);
  const r = realizedOutcome(record, horizon);

  const barPct = Math.round(bar * 100);
  const convPct = toPct(record.verdict.judgeRaw.conviction);
  const vc = verdictChip(g.action);

  // Outcome readout
  let outcomeText: string;
  if (r === null) {
    outcomeText = 'no forward data at this horizon';
  } else {
    const sign = r >= 0 ? '+' : '';
    const outcome =
      g.action === 'NO_TRADE'
        ? 'sat out'
        : r >= 0
        ? 'was right'
        : 'was wrong';
    outcomeText = `at bar ${barPct} this call ${outcome} (${sign}${r.toFixed(2)}%)`;
  }

  // Flip-point text
  const fpText = fp !== null ? `this verdict survives down to bar ${Math.round(fp * 100)}` : null;

  // Slider fill % for CSS inset color (up to fp if it exists)
  const fillPct = bar * 100;
  const fpPct = fp !== null ? fp * 100 : null;

  return (
    <section
      data-reveal
      style={{ marginTop: 'var(--s-5)' }}
      aria-label="Tune the gate — conviction threshold explorer"
    >
      <div className="card" style={{ borderColor: 'var(--acc-40)' }}>
        {/* Panel header — honest framing (spec §5.1, non-negotiable) */}
        <span className="eyebrow">what this ruling becomes at this threshold</span>
        <p
          className="faint"
          style={{ margin: 'var(--s-2) 0 var(--s-4)', fontSize: 13 }}
        >
          the debate itself doesn&apos;t change — this is arithmetic on one stored ruling.
        </p>

        {/* TASK 9: exploratory lock insertion point → {expl.locked && <ExploratoryBadge />} */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 'var(--s-5)',
            alignItems: 'start',
          }}
        >
          {/* Left: controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
            {/* Conviction slider */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 'var(--s-2)',
                }}
              >
                <label
                  className="mono"
                  htmlFor="tune-bar-slider"
                  style={{ fontSize: 12, color: 'var(--ink-dim)' }}
                >
                  conviction bar
                </label>
                <span className="num" style={{ fontSize: 14, color: 'var(--accent-hi)' }}>
                  {barPct}
                </span>
              </div>

              {/* Slider wrapper — positions the flip-point notch */}
              <div style={{ position: 'relative' }}>
                <input
                  id="tune-bar-slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={bar}
                  onChange={(e) => setBar(parseFloat(e.target.value))}
                  className="slider"
                  style={{ '--fill-pct': `${fillPct}%` } as React.CSSProperties}
                  aria-label={`conviction bar: ${barPct}`}
                />
                {/* Flip-point notch — absolute over the slider track */}
                {fpPct !== null && (
                  <div
                    className="flip-marker"
                    style={{ left: `${fpPct}%` }}
                    title={`flip point: bar ${Math.round(fpPct)}`}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Flip-point text */}
              {fpText && (
                <p
                  className="faint mono"
                  style={{ margin: 'var(--s-2) 0 0', fontSize: 11 }}
                >
                  {fpText}
                </p>
              )}
            </div>

            {/* Horizon selector */}
            <div>
              <div
                className="mono"
                style={{ fontSize: 12, color: 'var(--ink-dim)', marginBottom: 'var(--s-2)' }}
              >
                forward horizon (days)
              </div>
              <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
                {HORIZONS.map((h) => (
                  <button
                    key={h}
                    onClick={() => setHorizon(h)}
                    className={`btn ${horizon === h ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '6px 14px', fontSize: 13 }}
                    aria-pressed={horizon === h}
                  >
                    {h}d
                  </button>
                ))}
              </div>
            </div>

            {/* Outcome readout */}
            <div
              className="card"
              style={{
                background: 'var(--s2)',
                padding: 'var(--s-3) var(--s-4)',
                fontSize: 13,
              }}
            >
              <span className="mono" style={{ color: r === null ? 'var(--ink-faint)' : 'var(--ink-dim)' }}>
                {outcomeText}
              </span>
            </div>

            {/* Re-gated size/stop readout */}
            <div style={{ display: 'flex', gap: 'var(--s-4)' }}>
              <div>
                <div className="faint mono" style={{ fontSize: 11 }}>
                  size
                </div>
                <div className="num" style={{ fontSize: 16, color: 'var(--ink)' }}>
                  {g.sizePct}%
                </div>
              </div>
              <div>
                <div className="faint mono" style={{ fontSize: 11 }}>
                  stop
                </div>
                <div className="num" style={{ fontSize: 16, color: 'var(--ink)' }}>
                  {g.stopPct}%
                </div>
              </div>
              <div>
                <div className="faint mono" style={{ fontSize: 11 }}>
                  action
                </div>
                <span className={`v ${vc.cls}`} style={{ marginTop: 4 }}>
                  {vc.label}
                </span>
              </div>
            </div>
          </div>

          {/* Right: re-gated VerdictSeal */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--s-3)' }}>
            <VerdictSeal
              conv={convPct}
              bar={barPct}
              verdict={sealVerdict(g.action)}
              dissent={dissentRole(record)}
              size={120}
              label
            />
            <span className="faint mono" style={{ fontSize: 10, textAlign: 'center', maxWidth: 100 }}>
              threshold seal
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
