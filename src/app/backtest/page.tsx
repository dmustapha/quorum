// File: src/app/backtest/page.tsx
// Event study, ported from the reference backtest.html onto the REAL committed
// evidence/backtest-result.json. Header, the equity-curve card (legend + real EquityChart), two
// .docket tables (IN-SAMPLE / OUT-OF-SAMPLE) from real panel.is/oos + ablation.is/oos, and the
// honest azure-bordered "reported as-is" card with the directional-signal caveat.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArmMetrics, BacktestResult } from '../../core/types';
import { EquityChart } from '../_components/equity-chart';
import { Field } from '../_components/field';

export const runtime = 'nodejs';

async function load(): Promise<BacktestResult | null> {
  try {
    const txt = await readFile(path.join(process.cwd(), 'evidence', 'backtest-result.json'), 'utf8');
    return JSON.parse(txt) as BacktestResult;
  } catch {
    return null;
  }
}

function MetricRow({ arm, m, accent }: { arm: string; m: ArmMetrics; accent?: boolean }) {
  return (
    <tr>
      <td className="mono" style={{ color: 'var(--ink)' }}>
        {arm}
      </td>
      <td className="num">{(m.hitRate * 100).toFixed(0)}%</td>
      <td className="num" style={accent ? { color: 'var(--accent-hi)' } : undefined}>
        {m.avgPnlPct.toFixed(2)}%
      </td>
      <td className="num">{m.sharpeLike.toFixed(2)}</td>
      <td className="num">{m.maxDrawdownPct.toFixed(2)}%</td>
    </tr>
  );
}

export default async function Backtest() {
  const result = await load();

  if (!result) {
    return (
      <section style={{ padding: 'var(--s-6) 0 var(--s-8)' }}>
        <div className="wrap content">
          <div className="card">
            <p style={{ margin: 0 }}>
              Backtest pending - run <code>npm run backtest</code> to populate this page.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const panelEnd = result.equityCurve.panel.at(-1) ?? 1;
  const ablEnd = result.equityCurve.ablation.at(-1) ?? 1;

  return (
    <section style={{ padding: 'var(--s-6) 0 var(--s-8)' }}>
      <Field glowA={false} glowB={false} engrave grain />
      <div className="wrap content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)' }}>
        <div data-reveal>
          <span className="eyebrow">Event study · panel vs single-LLM ablation</span>
          <h1 style={{ fontSize: 'var(--t-h2)', margin: 'var(--s-2) 0 0' }}>
            The same pipeline, run with and without the debate.
          </h1>
        </div>

        {/* equity curve card */}
        <div className="card" data-reveal>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              gap: 'var(--s-3)',
            }}
          >
            <div style={{ display: 'flex', gap: 'var(--s-5)', alignItems: 'center' }}>
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--f-mono)', fontSize: 12 }}
              >
                <span style={{ width: 16, height: 2, background: 'var(--accent)', display: 'inline-block' }} /> Panel
                (4 voices) · {panelEnd.toFixed(4)}
              </span>
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--f-mono)', fontSize: 12 }}
              >
                <span style={{ width: 16, height: 2, background: 'var(--azure)', display: 'inline-block' }} /> Single-LLM
                · {ablEnd.toFixed(4)}
              </span>
            </div>
            <span className="faint mono" style={{ fontSize: 12 }}>
              cumulative return · indexed to 1.00
            </span>
          </div>
          <EquityChart result={result} />
          <p className="faint mono" style={{ fontSize: 12, marginTop: 'var(--s-3)' }}>
            Strict OOS cutoff {result.config.oosCutoff} · {result.config.horizonDays}d horizon · bar{' '}
            {result.config.convictionBar}. Verdict {result.verdict}.
          </p>
        </div>

        {/* per-arm tables */}
        <div data-reveal style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-5)' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 'var(--s-4) var(--s-5) 0' }}>
              <span className="eyebrow">In-sample</span>
            </div>
            <table className="docket" style={{ marginTop: 'var(--s-3)' }}>
              <thead>
                <tr>
                  <th>Arm</th>
                  <th>Hit-rate</th>
                  <th>avg P&amp;L</th>
                  <th>Sharpe~</th>
                  <th>Max DD</th>
                </tr>
              </thead>
              <tbody>
                <MetricRow arm="Panel" m={result.panel.is} />
                <MetricRow arm="Single-LLM" m={result.ablation.is} />
              </tbody>
            </table>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 'var(--s-4) var(--s-5) 0' }}>
              <span className="eyebrow">Out-of-sample · never fit</span>
            </div>
            <table className="docket" style={{ marginTop: 'var(--s-3)' }}>
              <thead>
                <tr>
                  <th>Arm</th>
                  <th>Hit-rate</th>
                  <th>avg P&amp;L</th>
                  <th>Sharpe~</th>
                  <th>Max DD</th>
                </tr>
              </thead>
              <tbody>
                <MetricRow arm="Panel" m={result.panel.oos} accent />
                <MetricRow arm="Single-LLM" m={result.ablation.oos} />
              </tbody>
            </table>
          </div>
        </div>

        {/* honest note */}
        <div className="card" data-reveal style={{ borderColor: 'var(--azure-24)' }}>
          <span className="eyebrow" style={{ color: 'var(--azure)' }}>
            Reported as-is · directional-signal study, not alpha
          </span>
          <p style={{ margin: 'var(--s-3) 0 0', fontSize: '1.0625rem', color: 'var(--ink)' }}>
            Out-of-sample the panel issued {result.panel.oos.trades} advisory SHORT signals (hit-rate{' '}
            {(result.panel.oos.hitRate * 100).toFixed(0)}%, avg P&amp;L{' '}
            {result.panel.oos.avgPnlPct.toFixed(2)}%) while the single-LLM ablation cleared its own
            conviction bar {result.ablation.oos.trades} times ({result.ablation.oos.avgPnlPct.toFixed(2)}%).
            The OOS sample is tiny and non-random, so this measures the VALUE OF THE PANEL&apos;S CALLS AS
            SIGNALS - it is not executed returns and makes no alpha claim.
          </p>
          <p className="faint" style={{ marginTop: 'var(--s-4)', fontSize: 13 }}>
            The panel&apos;s value is the <strong style={{ color: 'var(--ink-dim)' }}>auditable record</strong> -
            provenance, not a promise of alpha. Both arms are shown either way.
          </p>
        </div>
      </div>
    </section>
  );
}
