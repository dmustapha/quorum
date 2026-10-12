// Server-only: reads leak-safe backtest evidence files and returns OOS-only rows.
// Inject `readFile` for testability; production callers pass `node:fs/promises` readFile.
import { fileURLToPath } from 'node:url';
import type { EventRow } from './backtest';

export interface LeakSafePayload {
  rows: EventRow[];
  dropped: number;
  verdict: string;
  bar: number;
}

const evidencePath = (file: string): string =>
  fileURLToPath(new URL(`../../evidence/${file}`, import.meta.url));

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
