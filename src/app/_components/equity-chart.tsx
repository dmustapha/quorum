// File: src/app/_components/equity-chart.tsx
// Hand-built SVG equity curve with real linear scales, y gridlines + ticks, x date ticks, an
// area fill under the Panel line, a dashed OOS-cutoff marker, and point markers at each event.
// Two series: Panel (lime) vs Ablation (dim). Reads the committed evidence arrays verbatim.
import type { BacktestResult } from '../../core/types';

const W = 920;
const H = 340;
const PAD = { top: 16, right: 20, bottom: 36, left: 46 };

export function EquityChart({ result }: { result: BacktestResult }) {
  const { panel, ablation, dates } = result.equityCurve;
  const n = panel.length;
  if (n < 2) return null;

  const all = [...panel, ...ablation];
  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  // pad the domain so the flat baseline isn't glued to an edge
  const span = rawMax - rawMin || 0.02;
  const yMin = rawMin - span * 0.25;
  const yMax = rawMax + span * 0.25;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (n - 1)) * plotW;
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  const line = (arr: number[]) => arr.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const panelPts = line(panel);
  const ablPts = line(ablation);
  const areaPts = `${PAD.left},${PAD.top + plotH} ${panelPts} ${PAD.left + plotW},${PAD.top + plotH}`;

  // y gridlines / ticks
  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / ticks);

  // OOS cutoff — first index whose date is >= cutoff
  const oosIdx = dates.findIndex((dt) => dt >= result.config.oosCutoff);
  const oosX = oosIdx > 0 ? x(oosIdx) : null;

  return (
    <div className="chart-wrap">
      <div className="chart-legend">
        <span className="leg"><span className="leg-swatch panel" /> Panel · {panel.at(-1)?.toFixed(4)}</span>
        <span className="leg"><span className="leg-swatch ablation" /> Ablation · {ablation.at(-1)?.toFixed(4)}</span>
        <span className="leg" style={{ marginLeft: 'auto', color: 'var(--lime)' }}>{result.verdict}</span>
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`Equity curve: Panel ends at ${panel.at(-1)?.toFixed(4)}, ablation flat at ${ablation.at(-1)?.toFixed(4)}; panel beats out-of-sample.`}>
        <defs>
          <linearGradient id="panelArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(182,255,60,0.18)" />
            <stop offset="100%" stopColor="rgba(182,255,60,0)" />
          </linearGradient>
        </defs>

        <g className="chart-grid">
          {yTicks.map((t, i) => (
            <line key={i} x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
          ))}
        </g>
        <g className="chart-axis">
          {yTicks.map((t, i) => (
            <text key={i} x={PAD.left - 8} y={y(t) + 3} textAnchor="end">{t.toFixed(3)}</text>
          ))}
          {dates.map((dt, i) =>
            i % Math.ceil(n / 6) === 0 || i === n - 1 ? (
              <text key={i} x={x(i)} y={H - PAD.bottom + 16} textAnchor="middle">{dt.slice(5)}</text>
            ) : null,
          )}
        </g>

        {oosX !== null && (
          <g className="chart-oos">
            <line x1={oosX} x2={oosX} y1={PAD.top} y2={PAD.top + plotH} />
            <text x={oosX + 4} y={PAD.top + 10} textAnchor="start">OOS CUTOFF</text>
          </g>
        )}

        <polygon points={areaPts} fill="url(#panelArea)" />
        <polyline className="chart-abl-line" points={ablPts} />
        <polyline className="chart-panel-line" points={panelPts} />

        {panel.map((v, i) => (
          <circle key={i} className="chart-mark" cx={x(i)} cy={y(v)} r={2.6} />
        ))}
      </svg>
      <div className="cav">
        Directional-signal evaluation, not executed returns. Strict OOS cutoff at{' '}
        {result.config.oosCutoff} · {result.config.horizonDays}d horizon · recomputed from
        committed evidence · not significance-tested.
      </div>
    </div>
  );
}
