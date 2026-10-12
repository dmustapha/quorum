'use client';
// File: src/app/_components/debate-stream.tsx
// Consumes the SSE stream from POST /api/run and renders debate stages progressively.
// The ~20-90s live latency IS the show — each stage reveals as it lands.

import { useEffect, useReducer, useRef } from 'react';
import type { CatalystEvent, StreamEvent, Role } from '../../core/types';
import { reduceStream, initialStreamState } from './stream-reducer';
import { AdvocateCard } from './advocate-card';
import { verdictChip, shortSym } from './seal-data';

const ROLES: Role[] = ['bull', 'bear', 'risk'];

export function DebateStream({ event }: { event: CatalystEvent }) {
  const [state, dispatch] = useReducer(reduceStream, undefined, initialStreamState);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/run', {
          method: 'POST',
          body: JSON.stringify(event),
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}));
          dispatch({ type: 'error', stage: 'fetch', message: body?.error ?? `Run failed (HTTP ${res.status})` });
          return;
        }

        const reader = res.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Split on double-newline (SSE frame separator); keep trailing partial
          const frames = buffer.split('\n\n');
          buffer = frames.pop() ?? ''; // last element is the incomplete trailing partial

          for (const frame of frames) {
            // Extract the data: line from the frame
            const dataLine = frame.split('\n').find((l) => l.startsWith('data: '));
            if (!dataLine) continue;
            try {
              const ev: StreamEvent = JSON.parse(dataLine.slice(6));
              dispatch(ev);
            } catch {
              // malformed frame — skip
            }
          }
        }
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        dispatch({ type: 'error', stage: 'stream', message: String(err) });
      } finally {
        if (readerRef.current) {
          readerRef.current.cancel().catch(() => {});
          readerRef.current = null;
        }
      }
    })();

    return () => {
      ctrl.abort();
      if (readerRef.current) {
        readerRef.current.cancel().catch(() => {});
        readerRef.current = null;
      }
    };
  }, [event]);

  const { phase, packet, args, verdict, record } = state;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)' }}>
      {/* Evidence header */}
      {packet && (
        <div className="card stage" data-reveal>
          <span className="eyebrow">Evidence assembled · {shortSym(packet.symbol)} {packet.eventType} {packet.eventDate}</span>
          <p className="dim" style={{ margin: 'var(--s-3) 0 0', fontSize: 13 }}>
            Close {packet.priceContext.close} · ATR14 {packet.priceContext.atr14.toFixed(4)} · as-of {packet.asOf.slice(0, 10)}
          </p>
        </div>
      )}

      {/* Analyst advocates */}
      {(phase === 'debating' || phase === 'ruling' || phase === 'done') && (
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
            {ROLES.map((role) => (
              <AdvocateCard key={role} role={role} arg={args[role]} pending={!args[role]} />
            ))}
          </div>
        </div>
      )}

      {/* Ruling — LIVE lesser state, no full Verdict Seal treatment */}
      {(phase === 'ruling' || phase === 'done') && verdict && (
        <div data-reveal style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-5)' }}>
          <div className="card stage" style={{ borderColor: 'var(--or-24)' }}>
            <span className="eyebrow">The ruling</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', marginTop: 'var(--s-3)', flexWrap: 'wrap' }}>
              <span className={`v ${verdictChip(verdict.decision.action).cls}`}>
                {verdictChip(verdict.decision.action).label}
              </span>
              <span className="live-badge">LIVE — unstudied, no backtest support</span>
            </div>
            <p className="dim" style={{ margin: 'var(--s-4) 0 0' }}>"{verdict.rationale}"</p>
            {record && (
              <p className="faint mono" style={{ marginTop: 'var(--s-3)', fontSize: 12 }}>
                ev {record.evidenceHash.slice(0, 16)}…
              </p>
            )}
          </div>
          <div className="card stage" style={{ borderColor: 'var(--azure-24)' }}>
            <span className="eyebrow" style={{ color: 'var(--azure)' }}>The case against</span>
            <p style={{ margin: 'var(--s-3) 0 0' }}>
              The best reason this call might be wrong:
            </p>
            <p style={{ margin: 'var(--s-2) 0 0' }}>"{verdict.minorityOpinion}"</p>
          </div>
        </div>
      )}

      {/* Honest-fail card */}
      {phase === 'failed' && (
        <div className="card" style={{ borderColor: 'var(--acc-40)' }} data-reveal>
          <span className="v v-reject">The panel couldn't reach a reading</span>
          <p className="dim" style={{ margin: 'var(--s-3) 0 0' }}>
            {state.error ?? 'An error occurred during the debate.'}
          </p>
          <p className="dim" style={{ margin: 'var(--s-2) 0 0', fontSize: 13 }}>
            Try again — transient model errors usually resolve on retry.
          </p>
        </div>
      )}

      {/* Streaming indicator */}
      {phase === 'idle' && (
        <p className="dim mono" style={{ fontSize: 13 }} data-reveal>
          Assembling evidence…
        </p>
      )}
    </div>
  );
}
