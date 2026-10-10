// File: src/app/backtest/page.tsx
// Reads the committed evidence/backtest-result.json: Panel vs single-LLM ablation IS/OOS metrics
// (F-007) + a simple equity-curve render + the strict OOS cutoff + the computed verdict. Honest
// "Backtest pending" empty state when the file is absent (P2 not run). No fabricated numbers.
import Link from 'next/link';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArmMetrics, BacktestResult } from '../../core/types';

export const runtime = 'nodejs';

async function load(): Promise<BacktestResult | null> {
  try {
    const txt = await readFile(path.join(process.cwd(), 'evidence', 'backtest-result.json'), 'utf8');
    return JSON.parse(txt) as BacktestResult;
  } catch {
    return null;
  }
}

function Row({ label, m }: { label: string; m: ArmMetrics }) {
  return (
    <tr>
      <td>{label}</td>
      <td>{m.events}</td>
      <td>{m.trades}</td>
      <td>{(m.hitRate * 100).toFixed(1)}%</td>
      <td>{m.avgPnlPct.toFixed(2)}%</td>
      <td>{m.sharpeLike.toFixed(2)}</td>
      <td>{m.maxDrawdownPct.toFixed(1)}%</td>
    </tr>
  );
}

// Minimal inline sparkline — no chart lib (functional scaffold; viz polish is design-phase).
function Curve({ values, color }: { values: number[]; color: string }) {
  if (!values.length) return null;
  const w = 480, h = 80, min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1 || 1)) * w},${h - ((v - min) / span) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} style={{ maxWidth: '100%' }} role="img" aria-label="equity curve">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}

export default async function Backtest() {
  const result = await load();

  return (
    <main className="wrap-wide">
      <nav className="nav" style={{ marginTop: 0, marginBottom: 'var(--s-5)' }}>
        <Link href="/">← Home</Link>
        <Link href="/proof">Proof</Link>
      </nav>

      {!result ? (
        <>
          <h2>Event study</h2>
          <div className="empty">
            <p style={{ margin: 0 }}>Backtest pending — run <code>npm run backtest</code> to populate this page.</p>
            <p className="dim" style={{ margin: 'var(--s-2) 0 0' }}>
              Panel-vs-ablation metrics and equity curves appear here from evidence/backtest-result.json.
            </p>
          </div>
        </>
      ) : (
        <>
          <h1 style={{ marginBottom: 'var(--s-2)' }}>Out-of-sample proof</h1>
          <p className="sub dim" style={{ maxWidth: 640, marginBottom: 'var(--s-4)' }}>
            Panel vs single-LLM ablation, evaluated strictly after the cutoff. A directional-signal
            study — not executed returns.
          </p>
          <div className="topline" style={{ marginBottom: 'var(--s-5)' }}>
            <span>OOS cutoff <b>{result.config.oosCutoff}</b></span>
            <span>horizon <b>{result.config.horizonDays}d</b></span>
            <span>bar <b>{result.config.convictionBar}</b></span>
            <span className={result.verdict === 'PANEL_BEATS_OOS' ? 'lime' : 'bad'} style={{ marginLeft: 'auto', letterSpacing: '0.08em' }}>
              {result.verdict}
            </span>
          </div>

          <div className="panel" style={{ marginTop: 'var(--s-4)' }}>
            <div className="panel-h">
              <span>IS / OOS metrics</span>
              <span className="vb">{result.verdict}</span>
            </div>
            <table className="metrics">
              <thead>
                <tr>
                  <th>arm</th><th>events</th><th>trades</th><th>hit</th>
                  <th>avg P&amp;L</th><th>sharpe~</th><th>maxDD</th>
                </tr>
              </thead>
              <tbody>
                <Row label="Panel IS" m={result.panel.is} />
                <Row label="Panel OOS" m={result.panel.oos} />
                <Row label="Ablation IS" m={result.ablation.is} />
                <Row label="Ablation OOS" m={result.ablation.oos} />
              </tbody>
            </table>
          </div>

          <div className="panel" style={{ marginTop: 'var(--s-4)' }}>
            <div className="panel-h">
              <span>Equity curve</span>
              <span>
                <span style={{ color: 'var(--lime)' }}>Panel</span> {result.equityCurve.panel.at(-1)?.toFixed(3)}
                {'  ·  '}
                <span className="dim">Ablation</span> {result.equityCurve.ablation.at(-1)?.toFixed(3)}
              </span>
            </div>
            <div style={{ padding: 'var(--s-4)' }}>
              <Curve values={result.equityCurve.panel} color="var(--lime)" />
              <Curve values={result.equityCurve.ablation} color="var(--fg-dim)" />
            </div>
            <div className="cav">
              Directional-signal evaluation, not executed returns. Strict OOS cutoff at{' '}
              {result.config.oosCutoff} · recomputed from committed evidence · not significance-tested.
            </div>
          </div>
        </>
      )}
    </main>
  );
}
