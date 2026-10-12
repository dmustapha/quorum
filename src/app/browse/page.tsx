// File: src/app/browse/page.tsx
// Server component: loads the full decision corpus and hands it to the BrowseGrid client island.
import { Audit } from '../../core/audit';
import { BrowseGrid } from '../_components/browse-grid';

export const runtime = 'nodejs';

export default async function BrowsePage() {
  const records = await new Audit().list();

  return (
    <main className="wrap content" style={{ paddingTop: 'var(--s-7)', paddingBottom: 'var(--s-9)' }}>
      <header style={{ marginBottom: 'var(--s-6)' }}>
        <p className="eyebrow" style={{ color: 'var(--ink-faint)', fontSize: 'var(--t-eyebrow)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 'var(--s-2)' }}>
          Decision corpus
        </p>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'var(--t-h1)', color: 'var(--ink)', margin: 0 }}>
          Browse all decisions
        </h1>
        <p style={{ color: 'var(--ink-dim)', marginTop: 'var(--s-3)', fontSize: 'var(--t-body)' }}>
          {records.length} {records.length === 1 ? 'decision' : 'decisions'} on record. Filter, sort, and pin two to compare.
        </p>
      </header>
      <BrowseGrid records={records} />
    </main>
  );
}
