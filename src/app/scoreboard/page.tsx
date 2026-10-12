'use client';
import { useEffect, useState } from 'react';
import type { Scoreboard } from '../../core/scoreboard';
import { exploratoryState } from '../../core/preregistration';
import { CalibrationCurve } from '../_components/calibration-curve';
import { StatRow } from '../_components/stat-row';

interface ScoreboardResponse {
  scoreboard: Scoreboard;
  verdict: string;
  bar: number;
}

export default function ScoreboardPage() {
  const [data, setData] = useState<ScoreboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/scoreboard')
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <main className="wrap" style={{ paddingTop: 'var(--s-8)' }}>
        <p style={{ color: 'var(--ink-dim)' }}>Could not load scoreboard: {error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="wrap" style={{ paddingTop: 'var(--s-8)' }}>
        <p className="dim">Loading scoreboard…</p>
      </main>
    );
  }

  const { scoreboard: sb, verdict, bar } = data;
  const { showVerdictString } = exploratoryState(bar, 3);
  const { panelVsAblation: pva } = sb;

  const panelHitStat = { value: pva.panelHitRate, n: pva.panelN, dropped: sb.totalDropped };
  const ablHitStat = { value: pva.ablationHitRate, n: pva.ablationN, dropped: sb.totalDropped };

  const isEmpty = sb.totalScored === 0;

  return (
    <main className="wrap scoreboard-page" style={{ paddingTop: 'var(--s-7)', paddingBottom: 'var(--s-9)' }}>
      {/* verdict — only shown when at the pre-registered bar */}
      {showVerdictString && verdict && (
        <div className="scoreboard-verdict">
          <span className="eyebrow">Pre-registered verdict</span>
          <span className="scoreboard-verdict-string">{verdict}</span>
        </div>
      )}

      <header className="scoreboard-header">
        <span className="eyebrow">Judge performance</span>
        <h1>Panel calibration</h1>
        <p className="lede">
          When the panel expresses 70% conviction, how often was it right? A well-calibrated panel
          should land close to the dashed diagonal — the curve shows where confidence and reality
          diverge.
        </p>
      </header>

      {/* CENTERPIECE: calibration curve */}
      <section className="scoreboard-curve card">
        <CalibrationCurve buckets={sb.calibration} />
        {isEmpty && (
          <p className="dim" style={{ textAlign: 'center', marginTop: 'var(--s-3)' }}>
            no scored decisions yet
          </p>
        )}
      </section>

      {/* Demoted stats */}
      <section className="scoreboard-stats card" style={{ marginTop: 'var(--s-5)' }}>
        <h2 style={{ marginBottom: 'var(--s-4)', fontSize: 'var(--t-h2)' }}>Signal stats</h2>

        {/* Action mix */}
        {sb.actionMix.n > 0 ? (
          <div className="stat-row">
            <span className="stat-row-label">Action mix</span>
            <span className="stat-row-value mono">
              {sb.actionMix.long}L / {sb.actionMix.short}S / {sb.actionMix.noTrade} hold
              <span className="stat-row-caveat">{sb.actionMix.n} decisions total</span>
            </span>
          </div>
        ) : (
          <div className="stat-row">
            <span className="stat-row-label">Action mix</span>
            <span className="stat-row-value stat-subthreshold">no scored decisions yet</span>
          </div>
        )}

        <StatRow label="Hit rate" stat={sb.hitRate} />
        <StatRow
          label="The best reason this call might be wrong"
          stat={sb.caseAgainstRight}
          loud
        />

        {/* Panel vs ablation */}
        <div className="stat-row" style={{ marginTop: 'var(--s-3)', borderTop: '1px solid var(--border)', paddingTop: 'var(--s-3)' }}>
          <span className="stat-row-label">Panel vs single-model</span>
          <span className="stat-row-value">
            {pva.ablationN === 0 ? (
              <span className="stat-subthreshold">no ablation trades yet</span>
            ) : (
              <>
                <StatRow label="Panel hit rate" stat={panelHitStat} />
                <StatRow label="Single-model hit rate" stat={ablHitStat} />
              </>
            )}
          </span>
        </div>

        <p className="dim" style={{ fontSize: 'var(--t-small)', marginTop: 'var(--s-4)' }}>
          {sb.totalScored} total scored · {sb.totalDropped} excluded by gateway filter
        </p>
      </section>
    </main>
  );
}
