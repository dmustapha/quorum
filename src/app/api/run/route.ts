import { NextRequest } from 'next/server';
import { runCatalystStream } from '../../../pipeline/run-stream';
import { sseFrame } from './sse';
import type { CatalystEvent } from '../../../core/types';

export const runtime = 'nodejs';
// maxDuration must be >= the 90s panel deadline + margin AND <= the deploy platform's hard cap.
// Vercel Hobby caps at 60s, Pro allows up to 300s (spec §14 deploy re-provision). Deploy gate §14
// handles this; local/demo unaffected. Raised from 60 because 0G judge latency false-fails at 45s.
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!process.env.LLM_API_KEY) {
    return new Response(JSON.stringify({ error: 'LLM_API_KEY not set' }), { status: 503 });
  }
  let event: CatalystEvent;
  try {
    event = (await req.json()) as CatalystEvent;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }
  if (!event || !event.symbol || !event.eventType || !event.date) {
    return new Response(JSON.stringify({ error: 'Missing catalyst fields (symbol, eventType, date)' }), { status: 400 });
  }
  const encoder = new TextEncoder();
  // Explicit disconnect→abort: cancel() fires when the client closes the connection.
  const ac = new AbortController();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const ev of runCatalystStream(event, { signal: ac.signal })) {
          controller.enqueue(encoder.encode(sseFrame(ev)));
        }
      } catch (e) {
        controller.enqueue(encoder.encode(sseFrame({ type: 'error', stage: 'route', message: String(e) })));
      } finally {
        controller.close();
      }
    },
    cancel() { ac.abort(); },   // client disconnected → abort the inline run
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
