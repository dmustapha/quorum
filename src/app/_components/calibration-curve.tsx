// Server-safe SVG — no 'use client'. Mirror equity-chart.tsx conventions.
import type { CalibrationBucket } from '../../core/scoreboard';
import { curvePoints } from '../../core/curve-geometry';

const X0 = 60;
const X1 = 920;
const Y0 = 30;
const Y1 = 300;
const W = X1 - X0;
const H = Y1 - Y0;

// Map bucket conviction-center and hitRate into SVG coordinate space
const toSvgX = (convX: number) => X0 + convX;
const toSvgY = (geomY: number) => Y0 + geomY;

export function CalibrationCurve({ buckets }: { buckets: CalibrationBucket[] }) {
  const pts = curvePoints(buckets, W, H);

  // "no data" ticks — buckets with null hitRate
  const nullBuckets = buckets.filter((b) => b.hitRate === null);

  const pointsLine =
    pts.length > 1
      ? pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.x)} ${toSvgY(p.y)}`).join(' ')
      : null;

  // Perfect calibration reference: from (X0, Y1) to (X1, Y0) — conviction 0 → hitRate 0 (bottom-left), conviction 1 → hitRate 1 (top-right)
  const refX1 = X0;
  const refY1 = Y1;
  const refX2 = X1;
  const refY2 = Y0;

  const xTicks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <svg
      viewBox="0 0 960 340"
      style={{ width: '100%', height: 'auto', marginTop: 'var(--s-4)' }}
      role="img"
      aria-label={`Calibration curve: ${pts.length} conviction buckets plotted. Dashed line shows perfect calibration.`}
    >
      {/* y-axis gridlines + labels ("how often right") */}
      {[0, 0.25, 0.5, 0.75, 1.0].map((v, i) => {
        const y = Y0 + (1 - v) * H;
        return (
          <g key={i}>
            <line x1={X0} y1={y} x2={X1} y2={y} stroke="var(--ink-10)" strokeWidth={1} />
            <text
              x={X0 - 8}
              y={y + 4}
              textAnchor="end"
              className="mono"
              fill="var(--ink-dim)"
              fontSize="10"
            >
              {Math.round(v * 100)}%
            </text>
          </g>
        );
      })}

      {/* x-axis labels ("conviction says") */}
      {xTicks.map((v, i) => (
        <text
          key={i}
          x={X0 + v * W}
          y={Y1 + 16}
          textAnchor="middle"
          className="mono"
          fill="var(--ink-dim)"
          fontSize="10"
        >
          {Math.round(v * 100)}%
        </text>
      ))}

      {/* axis labels */}
      <text
        x={X0 + W / 2}
        y={Y1 + 30}
        textAnchor="middle"
        fill="var(--ink-dim)"
        fontSize="11"
        letterSpacing=".08em"
        className="mono"
      >
        CONVICTION SAYS
      </text>
      <text
        x={X0 - 46}
        y={Y0 + H / 2}
        textAnchor="middle"
        fill="var(--ink-dim)"
        fontSize="11"
        letterSpacing=".08em"
        className="mono"
        transform={`rotate(-90, ${X0 - 46}, ${Y0 + H / 2})`}
      >
        HOW OFTEN RIGHT
      </text>

      {/* perfect calibration dashed reference */}
      <line
        x1={refX1}
        y1={refY1}
        x2={refX2}
        y2={refY2}
        stroke="var(--ink-20)"
        strokeWidth={1.5}
        strokeDasharray="6 4"
      />

      {/* "no data" ticks for null buckets */}
      {nullBuckets.map((b, i) => {
        const cx = X0 + ((b.lo + b.hi) / 2) * W;
        return (
          <g key={`null-${i}`} opacity={0.4}>
            <line x1={cx} y1={Y0} x2={cx} y2={Y1} stroke="var(--ink-10)" strokeWidth={1} strokeDasharray="3 3" />
            <text x={cx} y={Y0 - 6} textAnchor="middle" fill="var(--ink-faint)" fontSize="9" className="mono">
              no data
            </text>
          </g>
        );
      })}

      {/* connecting line through plotted points */}
      {pointsLine && (
        <path
          d={pointsLine}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.72}
        />
      )}

      {/* data points */}
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={toSvgX(p.x)}
          cy={toSvgY(p.y)}
          r={4}
          fill="var(--accent)"
          stroke="var(--bg-base)"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}
