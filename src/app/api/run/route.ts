// File: src/app/api/run/route.ts
import { NextResponse } from 'next/server';
import { runCatalyst } from '../../../pipeline/run-catalyst';
import type { CatalystEvent } from '../../../core/types';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  // Honest key-gate: the panel cannot run without an LLM key. Return a clear 503 state
  // the UI can render — never a crash, never a fabricated verdict (INVARIANT 2 / ESCALATE).
  if (!process.env.LLM_API_KEY) {
    return NextResponse.json({ error: 'LLM_API_KEY not configured' }, { status: 503 });
  }
  try {
    const event = (await req.json()) as CatalystEvent;
    const record = await runCatalyst(event);
    return NextResponse.json(record);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 }); // ESCALATE surfaced, not mocked
  }
}
