import type { StreamEvent } from '../../../core/types';

// One SSE frame. JSON.stringify guarantees a single line (newlines escaped), preserving framing.
export function sseFrame(event: StreamEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}
