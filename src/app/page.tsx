// File: src/app/page.tsx
// Landing — full-width product page. Server component reading the REAL audit store + committed
// backtest evidence. Hero + mechanism ("debate → judge+dissent → audited record") + a live
// decision showcase (the latest REAL verdict) + the two differentiators + the OOS-beats-ablation
// teaser. Honest empty state when no decisions exist. No fabricated hero.
import Link from 'next/link';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Audit } from '../core/audit';
import { DecisionCard } from './_components/decision-card';
import type { BacktestResult } from '../core/types';

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

  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="page-kicker">QUORUM · adversarial panel → judge → audited record</p>
          <h1 className="hero-h">The AI trading floor that argues before it trades.</h1>
          <p className="hero-sub">
            Four AIs argue each catalyst trade; a Judge rules — and keeps the losing argument on
            the record. Dissent is never erased.
          </p>
          <div className="hero-cta">
            <Link href="/demo" className="btn">Run the panel →</Link>
            <Link href="/app" style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>Browse decisions</Link>
          </div>

          <div className="diffs">
            <div className="diff">
              <p className="diff-h">Preserved dissent</p>
              <p className="diff-p">The strongest losing argument ships welded to every verdict — a first-class record, not a footnote. Judges can be wrong; the dissent is how you check.</p>
            </div>
            <div className="diff">
              <p className="diff-h">Honest execution</p>
              <p className="diff-p">SHORT verdicts are flagged ADVISORY · SPOT_LONG_ONLY — rTokens are spot-only, so no fill is ever fabricated. Longs are live-fillable spot buys.</p>
            </div>
          </div>
        </div>

        <div>
          {hero ? (
            <DecisionCard r={hero} />
          ) : (
            <div className="empty">
              <p style={{ margin: 0 }}>No decisions yet — run the panel to produce the first verdict.</p>
            </div>
          )}
        </div>
      </section>

      <div className="sec-h"><h2>How it works</h2><span className="sec-meta">three stages, one audited record</span></div>
      <div className="steps">
        <div className="step">
          <div className="step-n">01 · DEBATE</div>
          <div className="step-h">Bull, Bear & Risk argue</div>
          <p className="step-p">Three LLM counsel each build a thesis from the same evidence packet — price context, signals, the catalyst — citing the exact fields they rely on.</p>
        </div>
        <div className="step">
          <div className="step-n">02 · JUDGE + DISSENT</div>
          <div className="step-h">A Judge rules on the record</div>
          <p className="step-p">A fourth model weighs the arguments, issues an action, size, stop and conviction — and must preserve the strongest opposing view as a minority opinion.</p>
        </div>
        <div className="step">
          <div className="step-n">03 · AUDITED RECORD</div>
          <div className="step-h">Append-only, recomputable</div>
          <p className="step-p">Every verdict is hashed to its evidence packet and written to an append-only store. Re-pull the candles and recompute the hash yourself.</p>
        </div>
      </div>

      {bt && (
        <>
          <div className="sec-h"><h2>Out-of-sample teaser</h2><span className="sec-meta">evaluated strictly after the cutoff</span></div>
          <div className="stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))' }}>
            <div className="stat">
              <div className="stat-lbl">Panel OOS avg P&amp;L</div>
              <div className="stat-val lime">+{bt.panel.oos.avgPnlPct.toFixed(3)}%</div>
              <div className="stat-sub">{bt.panel.oos.trades} trades · hit {(bt.panel.oos.hitRate * 100).toFixed(0)}%</div>
            </div>
            <div className="stat">
              <div className="stat-lbl">Single-LLM ablation OOS</div>
              <div className="stat-val dim">{bt.ablation.oos.avgPnlPct.toFixed(3)}%</div>
              <div className="stat-sub">never cleared the conviction bar</div>
            </div>
            <div className="stat">
              <div className="stat-lbl">Verdict</div>
              <div className="stat-val lime" style={{ fontSize: 18 }}>{bt.verdict}</div>
              <div className="stat-sub"><Link href="/backtest">see the full event study →</Link></div>
            </div>
          </div>
          <p className="dim" style={{ fontFamily: 'var(--mono)', fontSize: 11, marginTop: 'var(--s-3)' }}>
            Directional-signal evaluation, not executed returns.
          </p>
        </>
      )}
    </div>
  );
}
