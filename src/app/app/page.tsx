// File: src/app/app/page.tsx
// The operator console, ported from the reference app.html onto REAL data. Left sticky rail:
// the rToken universe (data/universe.json) with real ruling-counts per token + scheduled
// catalysts (data/catalysts.json). Right: the DECISION LOG docket (one row per real record) and
// the running-panel block for the latest real decision (seal card + three advocate cards).
import Link from 'next/link';
import { Audit } from '../../core/audit';
import universe from '../../../data/universe.json';
import catalysts from '../../../data/catalysts.json';
import type { CatalystEvent } from '../../core/types';
import { VerdictSeal } from '../_components/verdict-seal';
import { Field } from '../_components/field';
import { DecisionDocket } from '../_components/decision-docket';
import {
  sealFromRecord,
  verdictChip,
  dissentRole,
  toPct,
  shortSym,
  ROLE_META,
} from '../_components/seal-data';

export const runtime = 'nodejs';

export default async function Console() {
  const records = await new Audit().list();
  const ordered = [...records].reverse(); // newest first
  const latest = records[records.length - 1];
  const events = catalysts as CatalystEvent[];
  const uni = universe as string[];

  const countFor = (sym: string) => records.filter((r) => r.packet.symbol === sym).length;

  const seal = latest ? sealFromRecord(latest) : null;
  const vc = latest ? verdictChip(latest.verdict.decision.action) : null;
  const latestArg = (role: string) =>
    latest?.transcript.arguments.find((a) => a.role === role)?.thesis ?? '';

  return (
    <section style={{ padding: 'var(--s-6) 0 var(--s-8)' }}>
      <Field glowA={false} glowB={false} engrave grain />
      <div
        className="wrap content"
        style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 'var(--s-6)', alignItems: 'start' }}
      >
        {/* LEFT RAIL */}
        <aside data-reveal style={{ position: 'sticky', top: 76 }}>
          <span className="eyebrow">rToken universe</span>
          <div className="card" style={{ padding: 'var(--s-3)', margin: 'var(--s-3) 0 var(--s-5)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {uni.map((sym) => {
                const n = countFor(sym);
                return (
                  <div
                    key={sym}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '7px 10px',
                      borderRadius: 'var(--r-sm)',
                      fontSize: 'var(--t-small)',
                    }}
                  >
                    <span className="mono" style={{ color: 'var(--ink)' }}>
                      {shortSym(sym)}
                    </span>
                    <span className="faint mono" style={{ fontSize: 11 }}>
                      {n} ruling{n === 1 ? '' : 's'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <span className="eyebrow">Scheduled catalysts</span>
          <div className="card" style={{ padding: 'var(--s-3)', marginTop: 'var(--s-3)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
              {events.slice(0, 8).map((ev, i) => (
                <div
                  key={`${ev.symbol}-${ev.date}-${i}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    borderLeft: '2px solid var(--border-strong)',
                    paddingLeft: 'var(--s-3)',
                  }}
                >
                  <span className="mono" style={{ fontSize: 12, color: 'var(--ink)' }}>
                    {shortSym(ev.symbol)} · {ev.eventType}
                  </span>
                  <span className="faint mono" style={{ fontSize: 11 }}>
                    as-of cutoff {ev.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)' }}>
          {/* DECISION LOG */}
          <div data-reveal>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                flexWrap: 'wrap',
                gap: 'var(--s-3)',
              }}
            >
              <div>
                <span className="eyebrow">Decision log · append-only record</span>
                <h1 style={{ fontSize: 'var(--t-h2)', margin: 'var(--s-2) 0 0' }}>
                  Every verdict the panel has entered.
                </h1>
              </div>
              <span className="faint mono" style={{ fontSize: 12 }}>
                pre-registered bar <strong style={{ color: 'var(--ink-dim)' }}>60</strong> · dissent
                on every row
              </span>
            </div>
            {ordered.length ? (
              <DecisionDocket records={ordered} />
            ) : (
              <div className="card" style={{ marginTop: 'var(--s-4)' }}>
                <p style={{ margin: 0 }}>No decisions yet - run a panel from the demo.</p>
              </div>
            )}
          </div>

          {/* RUNNING PANEL · latest catalyst */}
          {latest && seal && vc && (
            <div data-reveal>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  flexWrap: 'wrap',
                  gap: 'var(--s-3)',
                }}
              >
                <span className="eyebrow">Running panel · latest catalyst</span>
                <span className="faint mono" style={{ fontSize: 12 }}>
                  {shortSym(latest.packet.symbol)} {latest.packet.eventType} · catalyst{' '}
                  {latest.packet.eventDate}
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '260px 1.1fr 1.1fr .9fr',
                  gap: 'var(--s-4)',
                  marginTop: 'var(--s-4)',
                  alignItems: 'start',
                }}
              >
                <div
                  className="card"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--s-3)' }}
                >
                  <span className="eyebrow" style={{ alignSelf: 'flex-start' }}>
                    Latest verdict
                  </span>
                  <VerdictSeal {...seal} size={120} label />
                  <span className={`v ${vc.cls}`}>{vc.label}</span>
                  <span className="num dim" style={{ fontSize: 12 }}>
                    conviction{' '}
                    <strong style={{ color: 'var(--accent-hi)' }}>
                      {toPct(latest.verdict.decision.conviction)}
                    </strong>{' '}
                    &gt; {toPct(latest.verdict.convictionBar)}
                  </span>
                  <span className="mono faint" style={{ fontSize: 11 }}>
                    ev {latest.evidenceHash.slice(0, 16)}…
                  </span>
                </div>
                {(['bull', 'bear', 'risk'] as const).map((role) => (
                  <div className="card" key={role}>
                    <span className={`v ${ROLE_META[role].cls}`}>{ROLE_META[role].title}</span>
                    <p style={{ margin: 'var(--s-3) 0 0' }}>{latestArg(role) || '—'}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 'var(--s-3)', marginTop: 'var(--s-4)' }}>
                <Link className="btn btn-primary" href={`/app/decision/${latest.id}`}>
                  Open full audit →
                </Link>
                <Link className="btn btn-ghost" href="/proof">
                  Open audit record
                </Link>
              </div>
              <p className="faint mono" style={{ fontSize: 12, marginTop: 'var(--s-3)' }}>
                Dissent ({dissentRole(latest)}) retained · {latest.transcript.rounds} round.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
