// File: src/app/backtest/page.tsx
// Out-of-sample proof. Reads committed evidence/backtest-result.json: Panel vs single-LLM
// ablation IS/OOS metrics (F-007), a REAL plotted equity chart (EquityChart), the strict OOS
// cutoff, and the computed verdict presented as prominent stat cards. Honest "pending" empty
// state when the file is absent. No fabricated numbers.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ArmMetrics, BacktestResult } from '../../core/types';
import { EquityChart } from '../_components/equity-chart';

export const runtime = 'nodejs';

async function load(): Promise<BacktestResult | null> {
  try {
    const txt = await readFile(path.join(process.cwd(), 'evidence', 'backtest-result.json'), 'utf8');
    return JSON.parse(txt) as BacktestResult;
  } catch {
    return null;
  }
}

function Row({ label, m, accent }: { label: string; m: ArmMetrics; accent?: boolean }) {
  return (
    <tr style={accent ? { background: 'rgba(182,255,60,0.04)' } : undefined}>
      <td style={accent ? { color: 'var(--lime)' } : undefined}>{label}</td>
      <td>{m.events}</td>
      <td>{m.trades}</td>
      <td>{(m.hitRate * 100).toFixed(1)}%</td>
      <td>{m.avgPnlPct.toFixed(2)}%</td>
      <td>{m.sharpeLike.toFixed(2)}</td>
      <td>{m.maxDrawdownPct.toFixed(1)}%</td>
    </tr>
  );
}

export default async function Backtest() {
  const result = await load();

  if (!result) {
    return (
      <div className="page">
        <div className="page-head"><div><h1>Out-of-sample proof</h1></div></div>
        <div className="empty">
          <p style={{ margin: 0 }}>Backtest pending — run <code>npm run backtest</code> to populate this page.</p>
          <p className="dim" style={{ margin: 'var(--s-2) 0 0' }}>
            Panel-vs-ablation metrics and equity curves appear here from evidence/backtest-result.json.
          </p>
        </div>
      </div>
    );
  }

  const beats = result.verdict === 'PANEL_BEATS_OOS';
  const pO = result.panel.oos;
  const aO = result.ablation.oos;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="page-kicker">event study · panel vs single-LLM ablation</p>
          <h1>Out-of-sample proof</h1>
          <p className="page-lede">
            Both arms evaluated strictly after the cutoff. A directional-signal study — not
            executed returns — recomputed from committed evidence.
          </p>
        </div>
        <span className={beats ? 'act-badge long' : 'act-badge short'} style={{ fontSize: 14, padding: '7px 12px' }}>
          {result.verdict}
        </span>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-lbl">Panel OOS avg P&amp;L</div>
          <div className="stat-val lime">+{pO.avgPnlPct.toFixed(3)}%</div>
          <div className="stat-sub">{pO.trades} trades · {pO.events} events</div>
        </div>
        <div className="stat">
          <div className="stat-lbl">Panel OOS hit rate</div>
          <div className="stat-val ok">{(pO.hitRate * 100).toFixed(0)}%</div>
          <div className="stat-sub">sharpe~ {pO.sharpeLike.toFixed(2)}</div>
        </div>
        <div className="stat">
          <div className="stat-lbl">Ablation OOS avg P&amp;L</div>
          <div className="stat-val dim">{aO.avgPnlPct.toFixed(3)}%</div>
          <div className="stat-sub">{aO.trades} trades · never cleared bar</div>
        </div>
        <div className="stat">
          <div className="stat-lbl">OOS cutoff</div>
          <div className="stat-val" style={{ fontSize: 20 }}>{result.config.oosCutoff}</div>
          <div className="stat-sub">{result.config.horizonDays}d horizon · bar {result.config.convictionBar}</div>
        </div>
      </div>

      <div className="sec-h"><h2>Equity curve</h2><span className="sec-meta">panel vs ablation · lime beating dim is the proof</span></div>
      <EquityChart result={result} />

      <div className="sec-h"><h2>IS / OOS metrics</h2><span className="sec-meta">in-sample vs out-of-sample, both arms</span></div>
      <div className="panel">
        <table className="metrics">
          <thead>
            <tr>
              <th>arm</th><th>events</th><th>trades</th><th>hit</th>
              <th>avg P&amp;L</th><th>sharpe~</th><th>maxDD</th>
            </tr>
          </thead>
          <tbody>
            <Row label="Panel IS" m={result.panel.is} />
            <Row label="Panel OOS" m={result.panel.oos} accent />
            <Row label="Ablation IS" m={result.ablation.is} />
            <Row label="Ablation OOS" m={result.ablation.oos} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
