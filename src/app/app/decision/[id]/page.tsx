// File: src/app/app/decision/[id]/page.tsx
// The HERO: full audit of one REAL decision. The 3-way debate renders as Bull / Bear / Risk
// opposing-counsel columns (F-002), then the Judge verdict as the ruling-on-tape, the PRESERVED
// MINORITY opinion as a prominent lime block (F-003), and the honest paper orderResult (F-005,
// never synthesized). NO_TRADE surfaces size 0 + no order (F-004). No fabrication.
import Link from 'next/link';
import { Audit } from '../../../../core/audit';
import type { Role } from '../../../../core/types';

export const runtime = 'nodejs';

const ORDER: Role[] = ['bull', 'bear', 'risk'];

function orderLine(status: string): { label: string; cls: string } {
  switch (status) {
    case 'advisory': return { label: 'ADVISORY · SPOT_LONG_ONLY — short is an honest signal; rTokens are spot-only, so no fill is fabricated', cls: 'dissent' };
    case 'skipped': return { label: 'NO ORDER — NO_TRADE (size 0)', cls: 'dim' };
    case 'rejected': return { label: 'REJECTED by venue', cls: 'bad' };
    default: return { label: 'FILLED', cls: 'ok' };
  }
}

export default async function Decision({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await new Audit().get(id);

  if (!r) {
    return (
      <div className="page">
        <div className="empty"><p style={{ margin: 0 }}>Decision not found.</p></div>
        <p style={{ marginTop: 'var(--s-4)' }}><Link href="/app">← Decisions</Link></p>
      </div>
    );
  }

  const d = r.verdict.decision;
  const pc = r.packet.priceContext;
  const act = d.action.toLowerCase().replace(/[^a-z_]/g, '');
  const order = orderLine(r.orderResult.status);
  const byRole = Object.fromEntries(r.transcript.arguments.map((a) => [a.role, a]));

  return (
    <div className="page">
      <p style={{ marginBottom: 'var(--s-4)' }}><Link href="/app">← Decisions</Link></p>

      <div className="page-head">
        <div>
          <p className="page-kicker">{r.packet.eventType} · as-of {r.packet.asOf} · event {r.packet.eventDate}</p>
          <h1>{r.packet.symbol} <span className="dim" style={{ fontSize: '0.5em', fontWeight: 400 }}>· {id.slice(0, 8)}</span></h1>
        </div>
        <span className={`act-badge ${act}`} style={{ fontSize: 16, padding: '8px 14px' }}>{d.action}</span>
      </div>

      <div className="topline" style={{ marginBottom: 'var(--s-5)' }}>
        <span>close <b>{pc.close}</b></span>
        <span>SMA20 <b>{pc.sma20.toFixed(2)}</b></span>
        <span>ATR14 <b>{pc.atr14.toFixed(2)}</b></span>
        <span>5d <b>{(pc.ret5d * 100).toFixed(2)}%</b></span>
        <span>vol <b>{(pc.vol / 1e6).toFixed(2)}M</b></span>
        <span className="lime">evidenceHash {r.evidenceHash.slice(0, 12)}…</span>
      </div>

      <div className="sec-h"><h2>Adversarial counsel</h2><span className="sec-meta">{r.transcript.arguments.length} opposing views · {r.transcript.rounds} round</span></div>
      <div className="counsel">
        {ORDER.map((role) => {
          const a = byRole[role];
          if (!a) return null;
          return (
            <div key={role} className={`cpanel ${role}`}>
              <div className="cpanel-h">
                <span className="cpanel-role">{role === 'risk' ? 'Risk' : role === 'bull' ? 'Bull' : 'Bear'}</span>
                <div className="cpanel-conf">
                  <span className="cpanel-conf-v">{a.confidence.toFixed(2)}</span>
                  <span className="cpanel-conf-t"><span className="cpanel-conf-f" style={{ width: `${Math.round(a.confidence * 100)}%` }} /></span>
                </div>
              </div>
              <p className="cpanel-thesis">{a.thesis}</p>
              {a.evidenceRefs.length > 0 && (
                <div className="cpanel-refs">
                  {a.evidenceRefs.slice(0, 4).map((ref, i) => (
                    <span key={i} className="cref">{ref.split('=')[0].slice(0, 28)}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sec-h"><h2>Judge ruling · on the record</h2></div>
      <section className="tape">
        <div className="tape-h">
          <span className="tape-ruling">Judge ruling · {r.packet.symbol}</span>
          <span className={`tape-act ${act}`}>{d.action}</span>
        </div>
        <div className="kv">
          <div><div className="k">conviction</div><div className="v">{d.conviction.toFixed(2)}</div></div>
          <div><div className="k">bar</div><div className="v">{r.verdict.convictionBar.toFixed(2)}</div></div>
          <div><div className="k">size</div><div className="v">{d.sizePct}%</div></div>
          <div><div className="k">stop</div><div className="v">{d.stopPct}%</div></div>
        </div>
        <p className="tape-rationale">{r.verdict.rationale}</p>
        <div className="min">
          <div className="min-lbl">Preserved minority opinion — dissent is never erased</div>
          <p>{r.verdict.minorityOpinion}</p>
        </div>
        <div className={`advis ${order.cls}`}>{order.label}</div>
        <div className="tape-f">
          <span>append-only · immutable record</span>
          <span>evidenceHash <span className="ok">{r.evidenceHash}</span></span>
        </div>
      </section>

      <div className="sec-h"><h2>Raw paper-order result</h2><span className="sec-meta">never synthesized</span></div>
      <pre>{JSON.stringify(r.orderResult, null, 2)}</pre>
    </div>
  );
}
