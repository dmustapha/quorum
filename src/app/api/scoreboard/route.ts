import { NextResponse } from 'next/server';
import { readFile as fsReadFile } from 'node:fs/promises';
import { loadLeakSafeRows } from '../../../core/scoreboard-source';
import { buildScoreboard } from '../../../core/scoreboard';

export const runtime = 'nodejs';

const readFile = (path: string): Promise<string> => fsReadFile(path, 'utf8');

export async function GET() {
  const { rows, dropped, verdict, bar } = await loadLeakSafeRows(readFile);
  const scoreboard = buildScoreboard(rows, { bar, dropped });
  return NextResponse.json({ scoreboard, verdict, bar });
}
