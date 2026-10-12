// Server-only: reads leak-safe backtest evidence files and returns OOS-only rows.
// Inject `readFile` for testability; production callers pass `node:fs/promises` readFile.
import path from 'node:path';
import type { EventRow } from './backtest';

export interface LeakSafePayload {
  rows: EventRow[];
  dropped: number;
  verdict: string;
  bar: number;
}

// Resolve against process.cwd() (same pattern as audit.ts) — Vercel traces evidence/**
// to the function's working dir, where import.meta.url-relative paths do not reliably point.
const evidencePath = (file: string): string => path.join(process.cwd(), 'evidence', file);

export async function loadLeakSafeRows(
  readFile: (path: string) => Promise<string>,
): Promise<LeakSafePayload> {
  try {
    const [eventsText, skippedText, resultText] = await Promise.all([
      readFile(evidencePath('backtest-events.jsonl')),
      readFile(evidencePath('backtest-skipped.json')),
      readFile(evidencePath('backtest-result.json')),
    ]);

    const rows: EventRow[] = eventsText
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => JSON.parse(line) as EventRow)
      .filter((row) => row.isOos === true);

    const parsed: unknown = JSON.parse(skippedText);
    const dropped = Array.isArray(parsed) ? parsed.length : 0;

    const result = JSON.parse(resultText) as { verdict: string; config: { convictionBar: number } };
    const verdict = result.verdict;
    const bar = result.config.convictionBar;

    return { rows, dropped, verdict, bar };
  } catch {
    return {
      rows: [],
      dropped: 0,
      verdict: 'PANEL_LOSES_OOS',
      bar: 0.6,
    };
  }
}
