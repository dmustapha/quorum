// File: src/app/app/decision/[id]/page.tsx
// Full audit of one REAL decision: EvidencePacket + the 3 analyst arguments (F-002) + Judge
// rationale + conviction + minorityOpinion (F-003) + the raw paper orderResult (F-005, never
// synthesized). NO_TRADE surfaces size 0 + no order (F-004).
import Link from 'next/link';
import { Audit } from '../../../../core/audit';

export const runtime = 'nodejs';

export default async function Decision({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await new Audit().get(id);

  if (!r) {
    return (
      <main className="wrap">
        <div className="empty"><p style={{ margin: 0 }}>Decision not found.</p></div>
        <nav className="nav"><Link href="/app">← Decision log</Link></nav>
      </main>
    );
  }

  const d = r.verdict.decision;
  return (
    <main className="wrap">
      <nav className="nav" style={{ marginTop: 0, marginBottom: 'var(--s-5)' }}>
        <Link href="/app">← Decision log</Link>
      </nav>

      <div className="topline" style={{ marginBottom: 'var(--s-5)' }}>
        <span><b>{r.packet.symbol}</b></span>
        <span>close <b>{r.packet.priceContext.close}</b></span>
        <span>SMA20 <b>{r.packet.priceContext.sma20}</b></span>
        <span>ATR14 <b>{r.packet.priceContext.atr14}</b></span>
        <span>5d <b>{r.packet.priceContext.ret5d}</b></span>
        <span>vol <b>{r.packet.priceContext.vol}</b></span>
      </div>

      <h1 style={{ marginBottom: 'var(--s-2)' }}>Decision {id.slice(0, 8)} — the record</h1>
      <p className="dim mono" style={{ wordBreak: 'break-all', fontSize: 12 }}>evidenceHash {r.evidenceHash}</p>

      <h3>Evidence packet</h3>
      <div className="card--sub mono">
        <p style={{ margin: 0 }}>
          <b>{r.packet.eventType}</b> · as-of {r.packet.asOf} · event {r.packet.eventDate}
        </p>
        <p className="dim" style={{ marginBottom: 0 }}>
          close {r.packet.priceContext.close} · sma20 {r.packet.priceContext.sma20} · atr14{' '}
          {r.packet.priceContext.atr14} · ret5d {r.packet.priceContext.ret5d} · vol{' '}
          {r.packet.priceContext.vol}
        </p>
      </div>

      <h3>Adversarial transcript · {r.transcript.arguments.length} counsel</h3>
      {r.transcript.arguments.map((a, i) => (
        <div key={i} className={`arg arg--${a.role}`}>
          <b>{a.role.toUpperCase()}</b>{' '}
          <span className="dim mono" style={{ fontSize: 11 }}>confidence {a.confidence}</span>
          <p style={{ margin: 'var(--s-1) 0 0' }}>{a.thesis}</p>
        </div>
      ))}

      <h3>Judge ruling</h3>
      <section className="tape" style={{ marginTop: 'var(--s-3)' }}>
        <div className="tape-h">
          <span className="tape-ruling">Verdict on tape</span>
          <span className={`tape-act ${d.action.toLowerCase().replace(/[^a-z_]/g, '')}`}>{d.action}</span>
        </div>
        <div className="kv">
          <div><div className="k">conviction</div><div className="v">{d.conviction.toFixed(2)}</div></div>
          <div><div className="k">size</div><div className="v">{d.sizePct}%</div></div>
          <div><div className="k">stop</div><div className="v">{d.stopPct}%</div></div>
        </div>
        <p className="tape-rationale">{r.verdict.rationale}</p>
        <div className="min">
          <div className="min-lbl">Preserved minority opinion</div>
          <p>{r.verdict.minorityOpinion}</p>
        </div>
      </section>

      <h3>Paper order result</h3>
      <pre>{JSON.stringify(r.orderResult, null, 2)}</pre>
    </main>
  );
}
