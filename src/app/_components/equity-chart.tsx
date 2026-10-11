// File: src/app/_components/equity-chart.tsx
// Equity curve in the reference's visual style (faint gridlines, OOS split shade + dashed divider,
// IN-SAMPLE / OUT-OF-SAMPLE labels, Panel = --accent, Single-LLM = --azure, endpoint dots) but
// plotting the REAL committed equityCurve arrays (panel[], ablation[], dates[]) with real linear
// scales and the real OOS cutoff index. Pure SVG from props — server-safe, no fabrication.
import type { BacktestResult } from '../../core/types';

const X0 = 40;
const X1 = 920;
const Y0 = 30;
const Y1 = 300;

export function EquityChart({ result }: { result: BacktestResult }) {
  const { panel, ablation, dates } = result.equityCurve;
  const n = panel.length;
  if (n < 2) return null;

  const all = [...panel, ...ablation];
  const rawLo = Math.min(...all);
  const rawHi = Math.max(...all);
  const span = rawHi - rawLo || 0.02;
  const lo = rawLo - span * 0.4;
  const hi = rawHi + span * 0.4;

  const xFor = (i: number) => X0 + (i / (n - 1)) * (X1 - X0);
  const yFor = (v: number) => Y1 - ((v - lo) / (hi - lo)) * (Y1 - Y0);

  // OOS split index — first date >= the committed cutoff.
  const oosIdx = dates.findIndex((dt) => dt >= result.config.oosCutoff);
  const split = oosIdx > 0 ? xFor(oosIdx) : null;

  // smooth-ish path through the real points
  const path = (arr: number[]) => {
    const pts = arr.map((v, i) => [xFor(i), yFor(v)] as [number, number]);
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i - 1];
      const [cx, cy] = pts[i];
      const mid = (px + cx) / 2;
      d += ` C ${mid} ${py}, ${mid} ${cy}, ${cx} ${cy}`;
    }
    return d;
  };

  const ticks = 5;
  const gridVals = Array.from({ length: ticks }, (_, i) => lo + ((hi - lo) * (i + 0.5)) / ticks);

  const panelEnd: [number, number] = [xFor(n - 1), yFor(panel[n - 1])];
  const ablEnd: [number, number] = [xFor(n - 1), yFor(ablation[n - 1])];

  return (
    <svg
      viewBox="0 0 960 340"
      style={{ width: '100%', height: 'auto', marginTop: 'var(--s-4)' }}
      role="img"
      aria-label={`Equity curves: panel ends at ${panel[n - 1].toFixed(4)}, single-LLM flat at ${ablation[n - 1].toFixed(4)} across in-sample and out-of-sample.`}
    >
      {/* gridlines + y labels */}
      {gridVals.map((v, i) => (
        <g key={i}>
          <line x1={X0} y1={yFor(v)} x2={X1} y2={yFor(v)} stroke="var(--ink-06)" strokeWidth={1} />
          <text
            x={X0 - 8}
            y={yFor(v) + 3}
            textAnchor="end"
            className="mono"
            fill="var(--ink-faint)"
            fontSize="10"
          >
            {v.toFixed(3)}
          </text>
        </g>
      ))}

      {/* OOS split shade + dashed divider */}
      {split !== null && (
        <>
          <rect x={split} y={Y0} width={X1 - split} height={Y1 - Y0} fill="var(--ink-04)" />
          <line
            x1={split}
            y1={Y0}
            x2={split}
            y2={Y1}
            stroke="var(--border-strong)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        </>
      )}

      {/* section labels */}
      <text x={X0} y={Y0 - 10} className="mono" fill="var(--ink-faint)" fontSize="11" letterSpacing=".1em">
        IN-SAMPLE
      </text>
      {split !== null && (
        <text
          x={split + 10}
          y={Y0 - 10}
          className="mono"
          fill="var(--ink-faint)"
          fontSize="11"
          letterSpacing=".1em"
        >
          OUT-OF-SAMPLE
        </text>
      )}

      {/* the two real curves */}
      <path
        d={path(ablation)}
        fill="none"
        stroke="var(--azure)"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={path(panel)}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* endpoint dots */}
      <circle cx={ablEnd[0]} cy={ablEnd[1]} r={3.5} fill="var(--azure)" />
      <circle cx={panelEnd[0]} cy={panelEnd[1]} r={3.5} fill="var(--accent)" />
    </svg>
  );
}
