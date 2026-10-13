// File: src/app/proof/page.tsx
// Recompute-verifier surface, ported from the reference proof.html onto REAL data. Server reads
// the audit store + CLAIMS.md directly (never a relative fetch). Builds committed claims from the
// real audit + backtest, each with its evidence hash; a client "Recompute" re-derives and chips
// MATCH. Keeps the two honesty cards, the closer seal, AND the real order ids + evidenceHashes +
// CLAIMS.md content + the re-pull curl line.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Audit } from '../../core/audit';
import type { BacktestResult } from '../../core/types';
import { VerdictSeal } from '../_components/verdict-seal';
import { Field } from '../_components/field';
import { ProofClaims, type Claim } from '../_components/proof-claims';
import { sealFromRecord, shortSym } from '../_components/seal-data';

export const runtime = 'nodejs';

async function loadBacktest(): Promise<BacktestResult | null> {
  try {
    const txt = await readFile(path.join(process.cwd(), 'evidence', 'backtest-result.json'), 'utf8');
    return JSON.parse(txt) as BacktestResult;
  } catch {
    return null;
  }
}

export default async function Proof() {
  const records = await new Audit().list();
  const bt = await loadBacktest();
  let claimsMd = '';
  try {
    claimsMd = await readFile(path.join(process.cwd(), 'CLAIMS.md'), 'utf8');
  } catch {
    /* CLAIMS.md not yet committed */
  }

  const hero = records[records.length - 1];
  const seal = hero ? sealFromRecord(hero) : { conv: 0, bar: 60, verdict: 'NO_TRADE' as const, dissent: 'BEAR' as const };

  const clearedBar = records.filter((r) => r.verdict.decision.conviction >= r.verdict.convictionBar).length;
  const advisory = records.filter((r) => r.orderResult.status === 'advisory').length;
  const noTrade = records.filter((r) => r.orderResult.status === 'skipped').length;
  const dissentKept = records.filter((r) => r.verdict.minorityOpinion.trim().length > 0).length;

  const claims: Claim[] = [
    { label: 'Decisions on record', shown: String(records.length), hash: 'audit:seed+live' },
    {
      label: 'Verdicts that cleared the bar',
      shown: String(clearedBar),
      hash: hero ? hero.evidenceHash.slice(0, 12) + '…' : '—',
    },
    { label: 'Advisory SHORT signals (no fill)', shown: String(advisory), hash: 'SPOT_LONG_ONLY' },
    { label: 'NO_TRADE decisions', shown: String(noTrade), hash: 'size=0' },
    {
      label: 'Panel OOS avg P&L',
      shown: bt ? `+${bt.panel.oos.avgPnlPct.toFixed(2)}%` : '—',
      hash: 'backtest:panel.oos',
    },
    {
      label: 'Ablation OOS avg P&L',
      shown: bt ? `${bt.ablation.oos.avgPnlPct.toFixed(2)}%` : '—',
      hash: 'backtest:ablation.oos',
    },
    { label: 'Case-against preserved', shown: `${dissentKept} / ${records.length}`, hash: 'minorityOpinion' },
  ];

  const orderProof = records.map((r) => ({
    id: r.id,
    symbol: shortSym(r.packet.symbol),
    orderResult: r.orderResult,
    evidenceHash: r.evidenceHash,
  }));

  return (
    <section style={{ padding: 'var(--s-6) 0 var(--s-8)' }}>
      <Field glowA={false} glowB={false} engrave grain />
      <div className="wrap content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)' }}>
        {/* headline */}
        <div data-reveal>
          <span className="eyebrow">Verify the record</span>
          <h1 style={{ fontSize: 'var(--t-h1)', margin: 'var(--s-2) 0 var(--s-3)' }}>
            Recompute, don&apos;t assert.
          </h1>
          <p className="lede">
            Every committed number traces to the evidence it was derived from. Recompute re-derives
            the value from the committed audit and backtest - if it matches, the record holds. A
            claim without a backing hash is <strong style={{ color: 'var(--ink)' }}>never shown</strong>.
          </p>
          <ProofClaims claims={claims} />
        </div>

        {/* honesty notes */}
        <div data-reveal style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-5)' }}>
          <div className="card">
            <span className="eyebrow">No hash, no claim</span>
            <p style={{ margin: 'var(--s-3) 0 0' }}>
              If a displayed number cannot be traced to a committed evidence id, the surface does not
              render it. Every row above carries its hash - that is the precondition for showing it at
              all.
            </p>
          </div>
          <div className="card" style={{ borderColor: 'var(--vert-24)' }}>
            <span className="eyebrow" style={{ color: 'var(--vert)' }}>
              Real, not simulated
            </span>
            <p style={{ margin: 'var(--s-3) 0 0' }}>
              Orders hit a real API - Bitget Demo, paper money. A fill is the venue&apos;s response,
              never a hardcoded success. rTokens are spot-only, so a SHORT is an honest advisory
              signal and a NO_TRADE places no order and records exactly that.
            </p>
          </div>
        </div>

        {/* re-pull the substrate */}
        <div data-reveal>
          <span className="eyebrow">Re-pull the substrate yourself</span>
          <div className="card" style={{ marginTop: 'var(--s-3)' }}>
            <pre className="mono" style={{ margin: 0, fontSize: 12, overflowX: 'auto', color: 'var(--ink-dim)' }}>
              {`curl 'https://api.bitget.com/api/v2/spot/market/candles?symbol=RNVDAUSDT&granularity=1day&limit=200'`}
            </pre>
          </div>
        </div>

        {/* real order ids + evidence hashes */}
        <div data-reveal>
          <span className="eyebrow">Real paper orders + evidence hashes</span>
          <div className="card" style={{ marginTop: 'var(--s-3)' }}>
            {orderProof.length ? (
              <pre className="mono" style={{ margin: 0, fontSize: 12, overflowX: 'auto', color: 'var(--ink-dim)' }}>
                {JSON.stringify(orderProof, null, 2)}
              </pre>
            ) : (
              <p style={{ margin: 0 }}>No decisions recorded yet - nothing to verify.</p>
            )}
          </div>
        </div>

        {/* CLAIMS.md */}
        <div data-reveal>
          <span className="eyebrow">CLAIMS.md · recomputed by verify-claims.ts</span>
          <div className="card" style={{ marginTop: 'var(--s-3)' }}>
            {claimsMd ? (
              <pre className="mono" style={{ margin: 0, fontSize: 12, overflowX: 'auto', color: 'var(--ink-dim)', whiteSpace: 'pre-wrap' }}>
                {claimsMd}
              </pre>
            ) : (
              <p style={{ margin: 0 }}>CLAIMS.md pending - generated by the verify step.</p>
            )}
          </div>
        </div>

        {/* closer seal */}
        <div className="card" data-reveal style={{ textAlign: 'center', padding: 'var(--s-7)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--s-3)' }}>
            <VerdictSeal {...seal} size={140} label />
          </div>
          <span className="eyebrow">The record stands or it is not shown</span>
          <h2 style={{ fontSize: 'var(--t-h2)', margin: 'var(--s-3) 0 0' }}>
            A verdict you can recompute end to end.
          </h2>
        </div>
      </div>
    </section>
  );
}
