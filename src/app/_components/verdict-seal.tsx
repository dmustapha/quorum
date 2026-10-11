// File: src/app/_components/verdict-seal.tsx
// The Verdict Seal, ported from quorum.js buildSeal + animateHeroSeal into a React client
// component. Renders the SVG purely from props (no document.createElementNS). Geometry is a
// verbatim port: viewBox 0 0 200 200, C=100, R=72, RINGR=84, three advocate arcs, a conviction
// ring swept to conv%, a bar notch at the threshold, a ruling core, and the azure dashed dissent
// thread. The hero variant animates through its verb loop (arcs draw, ring fills, core stamps,
// hold, loop) and respects prefers-reduced-motion.
'use client';

import { useEffect, useRef } from 'react';
import type { SealVerdict, DissentRole } from './seal-data';

const C = 100;
const R = 72;
const RINGR = 84;

const P = (cx: number, cy: number, r: number, ang: number): [number, number] => [
  cx + r * Math.cos(ang),
  cy + r * Math.sin(ang),
];
const polar = (cx: number, cy: number, r: number, deg: number) =>
  P(cx, cy, r, ((deg - 90) * Math.PI) / 180);

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const s = polar(cx, cy, r, a1);
  const e = polar(cx, cy, r, a0);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${s[0].toFixed(2)} ${s[1].toFixed(2)} A ${r} ${r} 0 ${large} 0 ${e[0].toFixed(2)} ${e[1].toFixed(2)}`;
}

const ROLES: Array<['bull' | 'bear' | 'risk', number]> = [
  ['bull', 20],
  ['bear', 140],
  ['risk', 260],
];
const DMAP: Record<DissentRole, number> = { BULL: 20, BEAR: 140, RISK: 260 };

function advocatePath(deg: number): string {
  const n = polar(C, C, R, deg);
  const cp = polar(C, C, R * 0.3, deg + 26);
  return `M ${n[0].toFixed(1)} ${n[1].toFixed(1)} Q ${cp[0].toFixed(1)} ${cp[1].toFixed(1)} ${C} ${C}`;
}

export interface VerdictSealProps {
  conv: number;
  bar: number;
  verdict: SealVerdict;
  dissent: DissentRole;
  size: number;
  label?: boolean;
  animate?: boolean;
  ariaLabel?: string;
}

export function VerdictSeal({
  conv,
  bar,
  verdict,
  dissent,
  size,
  label = false,
  animate = false,
  ariaLabel,
}: VerdictSealProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const sweep = (Math.max(0, Math.min(100, conv)) / 100) * 320;
  const ringD = sweep > 0 ? arcPath(C, C, RINGR, 0, sweep) : `M ${C} ${C - RINGR}`;
  const barAng = (bar / 100) * 320;
  const bi = polar(C, C, RINGR - 7, barAng);
  const bo = polar(C, C, RINGR + 7, barAng);

  const coreCls = 'seal-core' + (verdict === 'TRADE' ? ' stamped' : '');
  const coreStyle: React.CSSProperties =
    verdict === 'NO_TRADE'
      ? { fill: 'transparent', stroke: 'var(--ink-dim)' }
      : verdict === 'SHORT'
        ? { fill: 'var(--or-24)', stroke: 'var(--or)' }
        : {};

  const dd = DMAP[dissent] ?? 140;

  // Hero verb-loop animation — port of animateHeroSeal.
  useEffect(() => {
    if (!animate) return;
    const svg = svgRef.current;
    if (!svg) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const arcs = [...svg.querySelectorAll<SVGPathElement>('.seal-arc')];
    const ring = svg.querySelector<SVGPathElement>('.seal-ring');
    const core = svg.querySelector<SVGCircleElement>('.seal-core');
    if (!ring || !core) return;

    arcs.forEach((a) => {
      const L = a.getTotalLength();
      a.style.strokeDasharray = String(L);
      a.style.strokeDashoffset = reduce ? '0' : String(L);
    });
    const ringL = ring.getTotalLength();
    ring.style.strokeDasharray = String(ringL);
    ring.style.strokeDashoffset = reduce ? '0' : String(ringL);
    if (reduce) return;

    let timer: ReturnType<typeof setTimeout>;
    const run = () => {
      arcs.forEach((a) => {
        a.style.strokeDashoffset = String(a.getTotalLength());
        a.style.transition = 'none';
      });
      ring.style.strokeDashoffset = String(ringL);
      ring.style.transition = 'none';
      core.classList.remove('stamped');
      core.style.transform = 'scale(1)';
      arcs.forEach((a, i) => {
        setTimeout(() => {
          a.style.transition = 'stroke-dashoffset 1s var(--ease-out-cubic)';
          a.style.strokeDashoffset = '0';
        }, 220 * i + 120);
      });
      setTimeout(() => {
        ring.style.transition = 'stroke-dashoffset 1.3s var(--ease-out-expo)';
        ring.style.strokeDashoffset = '0';
      }, 1100);
      setTimeout(() => {
        core.classList.add('stamped');
        core.style.transition = 'transform .4s var(--ease-spring)';
        core.style.transformBox = 'fill-box';
        core.style.transformOrigin = 'center';
        core.style.transform = 'scale(1.35)';
      }, 2500);
      setTimeout(() => {
        core.style.transform = 'scale(1)';
      }, 2960);
      timer = setTimeout(run, 6200);
    };
    run();
    return () => clearTimeout(timer);
  }, [animate, conv, bar, verdict, dissent]);

  // Non-animated seals render fully resolved (strokeDashoffset 0 is the default when no
  // dasharray is set, so the arcs + ring show complete).
  return (
    <svg
      ref={svgRef}
      className="seal"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      focusable="false"
    >
      <circle cx={C} cy={C} r={R} className="seal-rim" />
      {ROLES.map(([role, deg]) => (
        <path key={role} d={advocatePath(deg)} className={`seal-arc ${role}`} />
      ))}
      <path d={ringD} className="seal-ring" />
      <line
        x1={bi[0].toFixed(1)}
        y1={bi[1].toFixed(1)}
        x2={bo[0].toFixed(1)}
        y2={bo[1].toFixed(1)}
        className="seal-bar"
      />
      <circle cx={C} cy={C} r={16} className={coreCls} style={coreStyle} />
      <path d={advocatePath(dd)} className="seal-dissent" />
      {label &&
        ROLES.map(([role, deg]) => {
          const t = polar(C, C, R + 12, deg);
          return (
            <text
              key={`l-${role}`}
              x={t[0].toFixed(1)}
              y={t[1].toFixed(1)}
              textAnchor="middle"
              dominantBaseline="middle"
              className="seal-label"
            >
              {role.toUpperCase()}
            </text>
          );
        })}
    </svg>
  );
}
