'use client';
// ExploratoryBadge — shown when the user moves off the pre-registered conviction bar / horizon.
// Uses --ink-dim + muted border, NOT --accent, to signal "this is not the tested claim".

export function ExploratoryBadge() {
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 'var(--s-2)',
        border: '1px solid var(--s3)',
        borderRadius: 6,
        padding: 'var(--s-3) var(--s-4)',
        marginBottom: 'var(--s-4)',
        background: 'var(--s1)',
      }}
      role="status"
      aria-label="Exploratory mode — not the out-of-sample claim"
    >
      <span
        className="mono"
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: 'var(--ink-dim)',
        }}
      >
        EXPLORATORY — not the out-of-sample claim
      </span>
      <span
        style={{
          fontSize: 12,
          color: 'var(--ink-faint)',
          lineHeight: 1.45,
        }}
      >
        you&apos;ve moved off the pre-registered setting (bar 0.6 / 3 days); numbers here are
        exploratory, not the tested claim.
      </span>
    </div>
  );
}
