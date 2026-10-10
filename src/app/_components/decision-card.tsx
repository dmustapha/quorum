// File: src/app/_components/decision-card.tsx
// The money-shot card: direction / size / stop / conviction + the ALWAYS-shown minority opinion
// (INVARIANT 4) + the honest paper-order result (INVARIANT 2/5 — never synthesized).
// Pure presentation of a real DecisionRecord; no data fabrication.
import type { DecisionRecord, OrderResult } from '../../core/types';

function orderLine(o: OrderResult): { label: string; cls: string } {
  if (o.status === 'skipped') return { label: 'NO ORDER — NO_TRADE (size 0)', cls: 'dim' };
  if (o.status === 'advisory') return { label: 'ADVISORY · SPOT_LONG_ONLY — short is an honest signal; rTokens are spot-only, so no fill is fabricated', cls: 'dissent' };
  if (o.status === 'rejected') return { label: `REJECTED — ${o.error ?? 'see raw'}`, cls: 'bad' };
  return { label: `FILLED${o.orderId ? ` · orderId ${o.orderId}` : ''}`, cls: 'ok' };
}

export function DecisionCard({ r }: { r: DecisionRecord }) {
  const d = r.verdict.decision;
  const order = orderLine(r.orderResult);
  const actClass = d.action.toLowerCase().replace(/[^a-z_]/g, '');
  return (
    <section className="tape">
      <div className="tape-h">
        <span className="tape-ruling">Judge ruling · {r.packet.symbol}</span>
        <span className={`tape-act ${actClass}`}>{d.action}</span>
      </div>
      <div className="kv">
        <div><div className="k">conviction</div><div className="v">{d.conviction.toFixed(2)}</div></div>
        <div><div className="k">size</div><div className="v">{d.sizePct}%</div></div>
        <div><div className="k">stop</div><div className="v">{d.stopPct}%</div></div>
      </div>
      <p className="tape-rationale">{r.verdict.rationale}</p>
      {/* INVARIANT 4 — minority/dissent is always rendered, never empty. */}
      <div className="min">
        <div className="min-lbl">Preserved minority opinion</div>
        <p>{r.verdict.minorityOpinion}</p>
      </div>
      <div className={`advis ${order.cls}`}>{order.label}</div>
      <div className="tape-f">
        <span>append-only · immutable record</span>
        <span>evidenceHash <span className="ok">{r.evidenceHash}</span></span>
      </div>
    </section>
  );
}
