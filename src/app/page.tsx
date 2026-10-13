// File: src/app/page.tsx
// Landing — ported verbatim from the reference landing.html onto REAL data. Server component:
// reads the audit store + committed backtest, derives the hero from the LATEST REAL decision
// (no fabricated TRADE/74), and passes seal props to the client VerdictSeal bits. Five bands:
// chamber hero, the panel, the ruling + minority, honest-or-nothing backtest teaser, the record.
import Link from 'next/link';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Audit } from '../core/audit';
import type { BacktestResult } from '../core/types';
import { VerdictSeal } from './_components/verdict-seal';
import { Field } from './_components/field';
import { MktBody } from './_components/mkt-body';
import {
  sealFromRecord,
  verdictChip,
  dissentRole,
  toPct,
  shortSym,
  ROLE_META,
} from './_components/seal-data';

export const runtime = 'nodejs';

async function loadBacktest(): Promise<BacktestResult | null> {
  try {
    const txt = await readFile(path.join(process.cwd(), 'evidence', 'backtest-result.json'), 'utf8');
    return JSON.parse(txt) as BacktestResult;
  } catch {
    return null;
  }
}

export default async function Landing() {
  const [records, bt] = await Promise.all([new Audit().list(), loadBacktest()]);
  const hero = records[records.length - 1];

  const seal = hero ? sealFromRecord(hero) : null;
  const heroChip = hero ? verdictChip(hero.verdict.decision.action) : null;
  const heroConv = hero ? toPct(hero.verdict.decision.conviction) : 0;
  const heroBar = hero ? toPct(hero.verdict.convictionBar) : 60;
  const heroDissent = hero ? dissentRole(hero) : 'BEAR';
  const heroSym = hero ? shortSym(hero.packet.symbol) : '';
  const heroHash = hero ? hero.evidenceHash.slice(0, 16) + '…' : '';
  const argOf = (role: string) =>
    hero?.transcript.arguments.find((a) => a.role === role)?.thesis ?? '';

  const pO = bt?.panel.oos;
  const aO = bt?.ablation.oos;

  return (
    <>
      <MktBody />

      {/* BAND 1 · CHAMBER */}
      <section id="chamber" style={{ padding: 'var(--s-8) 0', minHeight: 'auto' }}>
        <Field filaments glowA glowB engrave grain />
        <div
          className="wrap content"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr .9fr',
            gap: 'var(--s-8)',
            alignItems: 'center',
          }}
        >
          <div>
            <span className="eyebrow">Voir Dire · Adversarial trading, on the record</span>
            <h1 className="display" style={{ margin: 'var(--s-4) 0' }} data-reveal>
              Four AIs argue
              <br />
              each trade.
              <br />
              <span style={{ color: 'var(--accent)' }}>A Judge rules</span>
              <br />
              <span className="recess">and keeps the case against.</span>
            </h1>
            <p className="lede" data-reveal>
              A Bull, a Bear, and a Risk analyst argue every scheduled catalyst from opposing
              sides. A Judge rules on the record, triggers the only order that can be placed, and
              preserves the strongest losing argument - on every verdict, including a decision{' '}
              <em>not</em> to trade.
            </p>
            <div style={{ display: 'flex', gap: 'var(--s-3)', marginTop: 'var(--s-6)' }} data-reveal>
              <Link className="btn btn-primary" href="/demo">
                Run a panel →
              </Link>
              <Link className="btn btn-ghost" href="#honest">
                Does it beat one model?
              </Link>
            </div>
            <div style={{ display: 'flex', gap: 'var(--s-5)', marginTop: 'var(--s-7)' }} data-reveal>
              <div>
                <div className="num" style={{ fontSize: 'var(--t-stat)', color: 'var(--ink)' }}>
                  4
                </div>
                <div className="faint mono" style={{ fontSize: 12 }}>
                  voices per catalyst
                </div>
              </div>
              <div>
                <div className="num" style={{ fontSize: 'var(--t-stat)', color: 'var(--ink)' }}>
                  {heroBar}
                </div>
                <div className="faint mono" style={{ fontSize: 12 }}>
                  pre-registered bar
                </div>
              </div>
              <div>
                <div className="num" style={{ fontSize: 'var(--t-stat)', color: 'var(--ink)' }}>
                  100%
                </div>
                <div className="faint mono" style={{ fontSize: 12 }}>
                  case against preserved
                </div>
              </div>
            </div>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--s-4)' }}
            data-reveal
          >
            {hero && seal && heroChip ? (
              <div
                className="card"
                style={{
                  background: 'var(--s1)',
                  padding: 'var(--s-6)',
                  boxShadow: 'var(--glow-ruling)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--s-3)',
                }}
              >
                <span className="eyebrow" style={{ alignSelf: 'flex-start' }}>
                  Live · {heroSym} {hero.packet.eventType}
                </span>
                <VerdictSeal
                  {...seal}
                  size={300}
                  label
                  animate
                  ariaLabel={`Verdict Seal: ${heroSym} ${hero.packet.eventType} - conviction ${heroConv} over the bar of ${heroBar}, verdict ${heroChip.label}, ${heroDissent} — the case against preserved`}
                />
                <div style={{ display: 'flex', gap: 'var(--s-3)', alignItems: 'center' }}>
                  <span className={`v ${heroChip.cls}`}>{heroChip.label}</span>
                  <span className="num dim" style={{ fontSize: 13 }}>
                    conviction{' '}
                    <strong style={{ color: 'var(--accent-hi)' }}>{heroConv}</strong> &gt; {heroBar}
                  </span>
                </div>
                <div className="mono faint" style={{ fontSize: 11 }}>
                  case against ({heroDissent}) retained · ev {heroHash}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: 'var(--s-6)' }}>
                <p style={{ margin: 0 }}>No decisions yet - run a panel to produce the first verdict.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* BAND 2 · THE PANEL */}
      <section
        id="panel"
        style={{ padding: 'var(--s-9) 0', borderTop: '1px solid var(--border)', background: 'var(--s1)' }}
      >
        <div className="wrap">
          <span className="eyebrow" data-reveal>
            The panel · same evidence, opposing cases
          </span>
          <h2 style={{ fontSize: 'var(--t-h1)', margin: 'var(--s-3) 0 var(--s-6)' }} data-reveal>
            Three advocates argue. No single voice gets the last word.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr .9fr', gap: 'var(--s-4)' }}>
            {(['bull', 'bear', 'risk'] as const).map((role) => (
              <div className="card" data-reveal key={role}>
                <span className={`v ${ROLE_META[role].cls}`}>{ROLE_META[role].title}</span>
                <p style={{ margin: 'var(--s-3) 0 0' }}>{argOf(role) || '—'}</p>
              </div>
            ))}
          </div>
          <p className="faint mono" style={{ fontSize: 12, marginTop: 'var(--s-4)' }} data-reveal>
            Strict cutoff - the panel never sees data at or after the catalyst date. No foresight,
            no leakage.
          </p>
        </div>
      </section>

      {/* BAND 3 · THE RULING */}
      <section id="ruling" style={{ padding: 'var(--s-9) 0', borderTop: '1px solid var(--border)' }}>
        <Field glowA={0.2} glowB={false} grain />
        <div
          className="wrap content"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-6)', alignItems: 'start' }}
        >
          <div data-reveal>
            <span className="eyebrow">The ruling · the only trigger</span>
            <h2 style={{ fontSize: 'var(--t-h1)', margin: 'var(--s-3) 0 var(--s-5)' }}>
              The Judge is the gate. Remove the panel and no trade is possible.
            </h2>
            {hero && seal && heroChip && (
              <div className="card" style={{ borderColor: 'var(--acc-40)' }}>
                <div style={{ display: 'flex', gap: 'var(--s-4)', alignItems: 'center' }}>
                  <VerdictSeal {...seal} size={96} />
                  <div>
                    <span className={`v ${heroChip.cls}`}>{heroChip.label}</span>
                    <div
                      className="num"
                      style={{ fontSize: 'var(--t-stat)', color: 'var(--accent-hi)', lineHeight: 1.1 }}
                    >
                      {heroConv}
                      <span className="faint" style={{ fontSize: 16 }}>
                        {' '}
                        / bar {heroBar}
                      </span>
                    </div>
                    <div className="faint mono" style={{ fontSize: 12 }}>
                      {heroConv >= heroBar ? 'conviction cleared the bar' : 'conviction below the bar'}
                    </div>
                  </div>
                </div>
                <p style={{ margin: 'var(--s-4) 0 0' }} className="dim">
                  “{hero.verdict.rationale}”
                </p>
              </div>
            )}
          </div>
          <div data-reveal>
            <span className="eyebrow" style={{ color: 'var(--azure)' }}>
              The case against · never erased
            </span>
            <h2 style={{ fontSize: 'var(--t-h1)', margin: 'var(--s-3) 0 var(--s-5)' }}>
              The losing argument is kept with equal standing.
            </h2>
            {hero && (
              <div className="card" style={{ borderColor: 'var(--azure-24)' }}>
                <span className={`v ${ROLE_META[heroDissent.toLowerCase()].cls}`}>
                  {heroDissent} · the case against
                </span>
                <p style={{ margin: 'var(--s-3) 0 0' }}>“{hero.verdict.minorityOpinion}”</p>
                <p className="faint" style={{ marginTop: 'var(--s-4)', fontSize: 13 }}>
                  On every verdict - including{' '}
                  <strong style={{ color: 'var(--ink-dim)' }}>NO_TRADE</strong> - the strongest
                  losing case is recorded as a first-class part of the decision. Not a footnote.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* BAND 4 · HONEST OR NOTHING */}
      <section
        id="honest"
        style={{ padding: 'var(--s-9) 0', background: 'var(--bg-base)', borderTop: '1px solid var(--border)' }}
      >
        <Field glowA={false} glowB={0.18} engrave grain />
        <div className="wrap content" style={{ textAlign: 'center', maxWidth: 860 }} data-reveal>
          <span className="eyebrow">Honest or nothing</span>
          <h2 className="display" style={{ fontSize: 'var(--t-h1)', margin: 'var(--s-3) 0 var(--s-4)' }}>
            We report the out-of-sample result even when the panel loses.
          </h2>
          <p className="lede" style={{ margin: '0 auto var(--s-6)' }}>
            The claim is <strong>provenance, not alpha</strong>. The same pipeline runs minus the
            debate - a single-LLM ablation - on events it was never fit on, and both arms are shown
            either way.
          </p>
          {pO && aO && (
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-4)', textAlign: 'left' }}
            >
              <div className="card">
                <span className="eyebrow">Panel (4 voices)</span>
                <div className="num" style={{ fontSize: 'var(--t-stat)' }}>
                  +{pO.avgPnlPct.toFixed(2)}%{' '}
                  <span className="faint" style={{ fontSize: 14 }}>
                    avg P&amp;L · OOS
                  </span>
                </div>
                <div className="faint mono" style={{ fontSize: 12 }}>
                  hit {(pO.hitRate * 100).toFixed(0)}% · {pO.trades} trades · sharpe~{' '}
                  {pO.sharpeLike.toFixed(2)}
                </div>
              </div>
              <div className="card">
                <span className="eyebrow" style={{ color: 'var(--azure)' }}>
                  Single-LLM ablation
                </span>
                <div className="num" style={{ fontSize: 'var(--t-stat)', color: 'var(--azure)' }}>
                  {aO.avgPnlPct.toFixed(2)}%{' '}
                  <span className="faint" style={{ fontSize: 14 }}>
                    avg P&amp;L · OOS
                  </span>
                </div>
                <div className="faint mono" style={{ fontSize: 12 }}>
                  {aO.trades} positions cleared its own conviction bar
                </div>
              </div>
            </div>
          )}
          <p className="faint" style={{ marginTop: 'var(--s-5)' }}>
            A directional-signal study on committed rToken OHLCV, not executed returns and not
            significance-tested. Verdict {bt?.verdict ?? 'pending'}. The panel&apos;s value is the{' '}
            <em>auditable record</em>, not a promise of profit.{' '}
            <Link href="/backtest">See the full event study →</Link>
          </p>
        </div>
      </section>

      {/* BAND 5 · THE RECORD */}
      <section
        id="record"
        style={{ padding: 'var(--s-10) 0', borderTop: '1px solid var(--border)', textAlign: 'center' }}
      >
        <Field glowB engrave grain />
        <div className="wrap content" style={{ maxWidth: 760 }} data-reveal>
          {seal && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--s-4)' }}>
              <VerdictSeal {...seal} size={140} />
            </div>
          )}
          <span className="eyebrow">Recompute, don&apos;t assert</span>
          <h2
            className="display"
            style={{ fontSize: 'clamp(2rem,1.4rem + 3vw,3.4rem)', margin: 'var(--s-3) 0 var(--s-4)' }}
          >
            Every number traces to committed data and a hash.
          </h2>
          <p className="lede" style={{ margin: '0 auto var(--s-6)' }}>
            A verifier can recompute the whole chain from committed evidence. A claim that can&apos;t
            be recomputed is never shown. Orders hit a real API - paper, never a fabricated fill.
          </p>
          <div style={{ display: 'flex', gap: 'var(--s-3)', justifyContent: 'center' }}>
            <Link className="btn btn-primary" href="/app">
              Open the console →
            </Link>
            <Link className="btn btn-ghost" href="/proof">
              Verify the record
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
