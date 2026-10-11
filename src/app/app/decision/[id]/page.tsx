// File: src/app/app/decision/[id]/page.tsx
// Full audit of one REAL decision, ported from the reference decision.html. Server component:
// reads Audit().get(id). Layout: header + back link, then the 2-col equal-standing ruling
// (acc-40, big seal) + minority (azure-24), then the three advocate cards with real confidence,
// then the evidence packet + honest order-response cards. Not-found state preserved.
import Link from 'next/link';
import { Audit } from '../../../../core/audit';
import { VerdictSeal } from '../../../_components/verdict-seal';
import { Field } from '../../../_components/field';
import {
  sealFromRecord,
  verdictChip,
  orderChip,
  dissentRole,
  toPct,
  shortSym,
  ROLE_META,
} from '../../../_components/seal-data';

export const runtime = 'nodejs';

export default async function Decision({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await new Audit().get(id);

  if (!r) {
    return (
      <section style={{ padding: 'var(--s-6) 0 var(--s-8)' }}>
        <div className="wrap content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
          <div className="card">
            <p style={{ margin: 0 }}>Decision not found.</p>
          </div>
          <p>
            <Link className="nav-links" href="/app" style={{ color: 'var(--ink-dim)' }}>
              ← back to decision log
            </Link>
          </p>
        </div>
      </section>
    );
  }

  const d = r.verdict.decision;
  const seal = sealFromRecord(r);
  const vc = verdictChip(d.action);
  const oc = orderChip(r.orderResult);
  const dis = dissentRole(r);
  const conv = toPct(d.conviction);
  const bar = toPct(r.verdict.convictionBar);
  const cleared = conv >= bar;
  const byRole = Object.fromEntries(r.transcript.arguments.map((a) => [a.role, a]));
  const orderId =
    r.orderResult.status === 'filled' || r.orderResult.status === 'accepted'
      ? (r.orderResult.orderId ?? '—')
      : '—';

  return (
    <section style={{ padding: 'var(--s-6) 0 var(--s-8)' }}>
      <Field glowA={false} glowB={false} engrave grain />
      <div className="wrap content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)' }}>
        {/* header */}
        <div
          data-reveal
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: 'var(--s-3)',
          }}
        >
          <div>
            <span className="eyebrow">Decision audit · {id.slice(0, 8)}</span>
            <h1 style={{ fontSize: 'var(--t-h2)', margin: 'var(--s-2) 0 0' }}>
              {shortSym(r.packet.symbol)} · {r.packet.eventType}
            </h1>
          </div>
          <Link className="nav-links" href="/app" style={{ color: 'var(--ink-dim)', fontSize: 'var(--t-small)' }}>
            ← back to decision log
          </Link>
        </div>

        {/* ruling + minority */}
        <div
          data-reveal
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-5)', alignItems: 'stretch' }}
        >
          <div className="card" style={{ borderColor: 'var(--acc-40)', display: 'flex', flexDirection: 'column' }}>
            <span className="eyebrow">The ruling · record of verdict</span>
            <div style={{ display: 'flex', gap: 'var(--s-5)', alignItems: 'center', marginTop: 'var(--s-4)' }}>
              <VerdictSeal {...seal} size={160} label />
              <div>
                <span className={`v ${vc.cls}`}>{vc.label}</span>
                <div
                  className="num"
                  style={{ fontSize: 'var(--t-stat)', color: 'var(--accent-hi)', lineHeight: 1.1 }}
                >
                  {conv}
                  <span className="faint" style={{ fontSize: 16 }}>
                    {' '}
                    / bar {bar}
                  </span>
                </div>
                <div className="mono faint" style={{ fontSize: 12, marginTop: 4 }}>
                  conviction vs pre-registered bar{' '}
                  <span className="num" style={{ color: 'var(--ink-dim)' }}>
                    {bar}
                  </span>{' '}
                  - read the ring against its notch on the seal
                </div>
                <span className={`v ${cleared ? 'v-trade' : 'v-notrade'}`} style={{ marginTop: 8 }}>
                  {cleared ? `cleared the bar · ${conv} ≥ ${bar}` : `below the bar · ${conv} < ${bar}`}
                </span>
              </div>
            </div>
            <p className="dim" style={{ margin: 'var(--s-5) 0 0' }}>
              “{r.verdict.rationale}”
            </p>
          </div>

          <div className="card" style={{ borderColor: 'var(--azure-24)', display: 'flex', flexDirection: 'column' }}>
            <span className="eyebrow" style={{ color: 'var(--azure)' }}>
              Minority opinion · preserved, equal standing
            </span>
            <span className={`v ${ROLE_META[dis.toLowerCase()].cls}`} style={{ marginTop: 'var(--s-4)' }}>
              {dis} · preserved dissent
            </span>
            <p style={{ margin: 'var(--s-3) 0 0' }}>“{r.verdict.minorityOpinion}”</p>
            <p className="faint" style={{ marginTop: 'auto', paddingTop: 'var(--s-4)', fontSize: 13 }}>
              The strongest losing case is recorded as a first-class part of this decision - present
              on every verdict, including <strong style={{ color: 'var(--ink-dim)' }}>NO_TRADE</strong>.
              Never a footnote.
            </p>
          </div>
        </div>

        {/* three advocates */}
        <div data-reveal>
          <span className="eyebrow">The panel · three advocates, same evidence</span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1.2fr .9fr',
              gap: 'var(--s-4)',
              marginTop: 'var(--s-4)',
            }}
          >
            {(['bull', 'bear', 'risk'] as const).map((role) => {
              const a = byRole[role];
              return (
                <div className="card" key={role}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 'var(--s-2)',
                    }}
                  >
                    <span className={`v ${ROLE_META[role].cls}`}>{ROLE_META[role].title}</span>
                    {a && (
                      <span className="num faint" style={{ fontSize: 12 }}>
                        conf {a.confidence.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 'var(--s-3) 0 0' }}>{a?.thesis ?? '—'}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* evidence + order */}
        <div data-reveal style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-5)' }}>
          <div className="card">
            <span className="eyebrow">Evidence packet · strict cutoff</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)', marginTop: 'var(--s-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="faint mono" style={{ fontSize: 12 }}>
                  evidence hash
                </span>
                <span className="mono" style={{ color: 'var(--ink)' }}>
                  {r.evidenceHash.slice(0, 16)}…
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="faint mono" style={{ fontSize: 12 }}>
                  as-of cutoff
                </span>
                <span className="num" style={{ color: 'var(--ink)' }}>
                  {r.packet.asOf}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="faint mono" style={{ fontSize: 12 }}>
                  catalyst date
                </span>
                <span className="num" style={{ color: 'var(--ink)' }}>
                  {r.packet.eventDate}
                </span>
              </div>
            </div>
            <p className="faint" style={{ marginTop: 'var(--s-4)', fontSize: 13 }}>
              Evidence frozen as-of {r.packet.asOf}. No data at or after the catalyst date{' '}
              {r.packet.eventDate} entered the packet - the panel argued with information available
              only up to the cutoff. No foresight, no leakage.
            </p>
          </div>

          <div className="card">
            <span className="eyebrow">Order response · Bitget Demo (paper)</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)', marginTop: 'var(--s-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="faint mono" style={{ fontSize: 12 }}>
                  status
                </span>
                <span className={`v ${oc.cls}`}>{oc.label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="faint mono" style={{ fontSize: 12 }}>
                  order id
                </span>
                <span className="mono" style={{ color: 'var(--ink)' }}>
                  {orderId}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="faint mono" style={{ fontSize: 12 }}>
                  size / stop
                </span>
                <span className="num" style={{ color: 'var(--ink)' }}>
                  {d.sizePct}% / {d.stopPct}%
                </span>
              </div>
            </div>
            <p className="faint" style={{ marginTop: 'var(--s-4)', fontSize: 13 }}>
              A real API call to a paper venue - never a fabricated fill. rTokens are spot-only, so a
              SHORT is an honest advisory signal and a NO_TRADE places no order and says so.
            </p>
          </div>
        </div>

        {/* raw honesty */}
        <div data-reveal>
          <span className="eyebrow">Raw paper-order result · never synthesized</span>
          <div className="card" style={{ marginTop: 'var(--s-3)' }}>
            <pre
              className="mono"
              style={{ margin: 0, fontSize: 12, overflowX: 'auto', color: 'var(--ink-dim)' }}
            >
              {JSON.stringify(r.orderResult, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
