'use client';
// File: src/app/_components/browse-grid.tsx
// Client island: filter bar + sorted decision grid with pin-to-compare affordance.
import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { DecisionRecord } from '../../core/types';
import type { DecisionFilter } from '../../core/decision-filter';
import { filterSort } from '../../core/decision-filter';
import { shortSym, verdictChip, toPct } from './seal-data';

const COMPARE_KEY = 'quorum.compare';

function loadPinned(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(COMPARE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 2) : [];
  } catch {
    return [];
  }
}

export function BrowseGrid({ records }: { records: DecisionRecord[] }) {
  const [filter, setFilter] = useState<DecisionFilter>({ sortBy: 'date', dir: 'desc' });
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    setPinned(loadPinned());
  }, []);

  function togglePin(id: string) {
    setPinned((prev) => {
      let next: string[];
      if (prev.includes(id)) {
        next = prev.filter((x) => x !== id);
      } else if (prev.length < 2) {
        next = [...prev, id];
      } else {
        next = prev; // already 2, ignore
      }
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const rows = filterSort(records, filter);

  return (
    <div>
      <div className="filter-bar">
        <label className="filter-group">
          <span className="filter-label">Action</span>
          <select
            value={filter.action ?? ''}
            onChange={(e) => setFilter((f) => ({ ...f, action: e.target.value as DecisionFilter['action'] || undefined }))}
          >
            <option value="">All</option>
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
            <option value="NO_TRADE">NO_TRADE</option>
          </select>
        </label>

        <label className="filter-group">
          <span className="filter-label">Event type</span>
          <select
            value={filter.eventType ?? ''}
            onChange={(e) => setFilter((f) => ({ ...f, eventType: e.target.value as DecisionFilter['eventType'] || undefined }))}
          >
            <option value="">All</option>
            <option value="earnings">earnings</option>
            <option value="macro">macro</option>
          </select>
        </label>

        <label className="filter-group">
          <span className="filter-label">Token</span>
          <input
            type="text"
            placeholder="e.g. BTC"
            value={filter.token ?? ''}
            onChange={(e) => setFilter((f) => ({ ...f, token: e.target.value || undefined }))}
          />
        </label>

        <label className="filter-group">
          <span className="filter-label">Min conviction {filter.minConv !== undefined ? `${Math.round(filter.minConv * 100)}%` : '0%'}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={filter.minConv ?? 0}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setFilter((f) => ({ ...f, minConv: v > 0 ? v : undefined }));
            }}
          />
        </label>

        <label className="filter-group">
          <span className="filter-label">Sort by</span>
          <select
            value={filter.sortBy}
            onChange={(e) => setFilter((f) => ({ ...f, sortBy: e.target.value as DecisionFilter['sortBy'] }))}
          >
            <option value="date">Date</option>
            <option value="conviction">Conviction</option>
            <option value="token">Token</option>
          </select>
        </label>

        <label className="filter-group">
          <span className="filter-label">Order</span>
          <select
            value={filter.dir}
            onChange={(e) => setFilter((f) => ({ ...f, dir: e.target.value as 'asc' | 'desc' }))}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </label>

        {pinned.length === 2 && (
          <Link
            href={`/browse/compare?a=${pinned[0]}&b=${pinned[1]}`}
            className="compare-btn"
          >
            Compare {pinned.length} pinned
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="browse-empty">No decisions match the current filters.</p>
      ) : (
        <div className="browse-grid">
          {rows.map((r) => {
            const chip = verdictChip(r.verdict.decision.action);
            const isPinned = pinned.includes(r.id);
            const pinDisabled = !isPinned && pinned.length >= 2;
            return (
              <div key={r.id} className={`browse-row${isPinned ? ' browse-row--pinned' : ''}`}>
                <Link href={`/app/decision/${r.id}`} className="browse-row-link">
                  <span className="browse-id">{r.id.slice(0, 8)}</span>
                  <span className="browse-sym">{shortSym(r.packet.symbol)}</span>
                  <span className="browse-event">{r.packet.eventType}</span>
                  <span className="browse-date">{r.packet.eventDate}</span>
                  <span className={`verdict-chip ${chip.cls}`}>{chip.label}</span>
                  <span className="browse-conv">{toPct(r.verdict.decision.conviction)}%</span>
                </Link>
                <button
                  className={`pin-btn${isPinned ? ' pin-btn--active' : ''}`}
                  onClick={() => togglePin(r.id)}
                  disabled={pinDisabled}
                  title={isPinned ? 'Unpin' : pinDisabled ? 'Unpin one to add another' : 'Pin to compare'}
                >
                  {isPinned ? '★' : '☆'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
