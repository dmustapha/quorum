// File: src/app/_components/app-shell.tsx
// Persistent full-width application shell — a trading-terminal chrome. Left sidebar (logo, nav,
// rToken universe, live status) + a wide main content column. Replaces the old ~870px centered
// layout. Pure presentation; no data fabrication (universe is the real data/universe.json).
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const NAV = [
  { href: '/app', label: 'Decisions', hint: 'the record' },
  { href: '/backtest', label: 'Backtest', hint: 'OOS proof' },
  { href: '/demo', label: 'Demo', hint: 'run the panel' },
  { href: '/proof', label: 'Proof', hint: 'recompute' },
];

export function AppShell({ children, universe }: { children: ReactNode; universe: string[] }) {
  const path = usePathname();
  const isActive = (href: string) => path === href || (href !== '/' && path.startsWith(href));

  return (
    <div className="shell">
      <aside className="side">
        <Link href="/" className="brand">
          <span className="brand-mark">◆</span>
          <span className="brand-name">QUORUM</span>
          <span className="brand-sub">voir dire</span>
        </Link>

        <nav className="side-nav" aria-label="Primary">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`side-link${isActive(n.href) ? ' is-active' : ''}`}
              aria-current={isActive(n.href) ? 'page' : undefined}
            >
              <span className="side-link-l">{n.label}</span>
              <span className="side-link-h">{n.hint}</span>
            </Link>
          ))}
        </nav>

        <div className="side-sec">
          <div className="side-sec-h">rToken universe · {universe.length}</div>
          <div className="side-uni">
            {universe.map((s) => (
              <span key={s} className="uni-chip">{s.replace('USDT', '')}</span>
            ))}
          </div>
        </div>

        <div className="side-foot">
          <span className="status-dot" aria-hidden />
          <span className="status-txt">AUDIT STORE LIVE</span>
          <span className="status-sub">append-only · recomputable</span>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}
