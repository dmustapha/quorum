// File: src/app/browse/compare/page.tsx
// Server component: side-by-side compare of two decisions (?a=<id>&b=<id>).
// A null side renders "decision not found" via DecisionPane — the other side still renders.
import Link from 'next/link';
import { Audit } from '../../../core/audit';
import { resolvePair } from '../../../core/compare-resolve';
import { DecisionPane } from '../../_components/decision-pane';

export const runtime = 'nodejs';

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  const list = await new Audit().list();
  const pair = resolvePair(list, a, b);

  return (
    <main className="wrap" style={{ paddingTop: 'var(--s-7)', paddingBottom: 'var(--s-9)' }}>
      <div style={{ marginBottom: 'var(--s-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 'var(--s-3)' }}>
        <div>
          <p className="eyebrow" style={{ color: 'var(--ink-faint)', fontSize: 'var(--t-eyebrow)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 'var(--s-2)' }}>
            Compare
          </p>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'var(--t-h1)', color: 'var(--ink)', margin: 0 }}>
            Side-by-side
          </h1>
        </div>
        <Link href="/browse" style={{ color: 'var(--ink-dim)', fontSize: 'var(--t-small)', textDecoration: 'none' }}>
          ← back to browse
        </Link>
      </div>

      <div className="compare-cols">
        <DecisionPane record={pair.a} />
        <DecisionPane record={pair.b} />
      </div>
    </main>
  );
}
