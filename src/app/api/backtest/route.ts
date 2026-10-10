// File: src/app/api/backtest/route.ts
import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const txt = await readFile(path.join(process.cwd(), 'evidence', 'backtest-result.json'), 'utf8');
    return NextResponse.json(JSON.parse(txt));
  } catch {
    return NextResponse.json({ error: 'backtest not yet run' }, { status: 404 });
  }
}
