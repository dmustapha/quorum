// File: src/app/_components/site-chrome.tsx
// The reference chrome: sticky top nav (brand + mini seal, links, theme toggle), the scroll
// conviction indicator, reveal-on-scroll, and the argument-filament field — all ported from
// quorum.js (initReveals / initScrollInd / initTheme / buildFilaments) into React client bits.
'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { VerdictSeal } from './verdict-seal';
import type { SealProps } from './seal-data';

const NAV = [
  { href: '/app', label: 'Console' },
  { href: '/browse', label: 'Browse' },
  { href: '/app/decision', label: 'Decision' },
  { href: '/backtest', label: 'Backtest' },
  { href: '/proof', label: 'Proof' },
  { href: '/scoreboard', label: 'Scoreboard' },
  { href: '/demo', label: 'Run a panel' },
];

export function ScrollIndicator() {
  useEffect(() => {
    const el = document.documentElement;
    const on = () => {
      const h = el.scrollHeight - window.innerHeight;
      el.style.setProperty('--scroll', h > 0 ? (window.scrollY / h).toFixed(4) : '0');
    };
    window.addEventListener('scroll', on, { passive: true });
    on();
    return () => window.removeEventListener('scroll', on);
  }, []);
  return <div className="scroll-ind" />;
}

function ThemeToggle() {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const btn = ref.current;
    if (!btn) return;
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    btn.textContent = cur === 'dark' ? '☾' : '☀';
  }, []);
  const toggle = () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('quorum-theme', next);
    } catch {
      /* storage may be unavailable */
    }
    if (ref.current) ref.current.textContent = next === 'dark' ? '☾' : '☀';
  };
  return (
    <button
      ref={ref}
      className="btn btn-ghost"
      onClick={toggle}
      aria-label="Toggle theme"
      style={{ marginLeft: 12, width: 38, padding: '9px 0', justifyContent: 'center' }}
    >
      ☾
    </button>
  );
}

export function SiteNav({ seal }: { seal: SealProps }) {
  const path = usePathname();
  const active = (href: string) =>
    href === '/app'
      ? path === '/app'
      : path === href || path.startsWith(href + '/');
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand" style={{ color: 'var(--ink)' }}>
          <VerdictSeal {...seal} size={22} />
          Quorum
        </Link>
        <div className="nav-links">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={active(n.href) ? 'active' : undefined}>
              {n.label}
            </Link>
          ))}
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
}

export function SiteFooter({ seal }: { seal: SealProps }) {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: 'var(--s-6) 0' }}>
      <div
        className="wrap"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--s-3)',
        }}
      >
        <span className="brand" style={{ fontSize: '.95rem' }}>
          <VerdictSeal {...seal} size={18} /> Quorum
        </span>
        <span className="faint mono" style={{ fontSize: 12 }}>
          Paper orders on Bitget Demo · real API, no real money · the case against, never erased
        </span>
      </div>
    </footer>
  );
}

// Reveal-on-scroll — port of initReveals. Any element with data-reveal fades/slides in.
export function Reveals() {
  const pathname = usePathname();
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (ents) => {
        ents.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -15% 0px', threshold: 0.01 },
    );
    els.forEach((e) => io.observe(e));
    const t = setTimeout(
      () =>
        els.forEach((e) => {
          if (e.getBoundingClientRect().top < window.innerHeight) e.classList.add('in');
        }),
      400,
    );
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, [pathname]);
  return null;
}

// The argument-filament field — port of buildFilaments. Mount inside a .field as data-filaments.
export function Filaments() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ns = 'http://www.w3.org/2000/svg';
    svg.replaceChildren();
    const N = 9;
    for (let i = 0; i < N; i++) {
      const y = 40 + (i / N) * 840;
      const toward = 720 + Math.sin(i * 1.3) * 160;
      const warm = i % 2 === 0;
      const p = document.createElementNS(ns, 'path');
      const x0 = warm ? -60 : 1500;
      p.setAttribute(
        'd',
        `M ${x0} ${y} C ${toward * 0.4} ${y + (warm ? -40 : 40)}, ${toward * 0.8} ${y + (warm ? 26 : -26)}, ${toward} ${450}`,
      );
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', warm ? 'var(--ember)' : 'var(--haze)');
      p.setAttribute('stroke-width', (1.2 + (i % 3) * 0.5).toFixed(1));
      p.setAttribute('opacity', '0');
      const L = 1700;
      p.style.strokeDasharray = String(L);
      if (!reduce) {
        p.animate(
          [
            { strokeDashoffset: L, opacity: 0 },
            { opacity: 0.2, offset: 0.38 },
            { strokeDashoffset: -L * 0.32, opacity: 0.2, offset: 0.78 },
            { strokeDashoffset: -L * 0.55, opacity: 0 },
          ],
          { duration: 4600 + i * 150, iterations: Infinity, delay: i * 260, easing: 'cubic-bezier(.33,1,.68,1)' },
        );
      } else {
        p.setAttribute('opacity', '0.2');
        p.style.strokeDashoffset = String(L * 0.3);
      }
      svg.appendChild(p);
    }
    if (!reduce) {
      const node = document.createElementNS(ns, 'circle');
      node.setAttribute('cx', '720');
      node.setAttribute('cy', '450');
      node.setAttribute('r', '8');
      node.setAttribute('fill', 'none');
      node.setAttribute('stroke', 'var(--accent)');
      node.setAttribute('stroke-width', '1.4');
      node.animate(
        [
          { r: 4, opacity: 0 },
          { r: 10, opacity: 0.24, offset: 0.5 },
          { r: 26, opacity: 0 },
        ],
        { duration: 6200, iterations: Infinity, easing: 'ease-out' },
      );
      svg.appendChild(node);
    }
  }, []);
  return (
    <svg
      ref={ref}
      className="filaments"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    />
  );
}
