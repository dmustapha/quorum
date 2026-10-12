import { describe, it, expect } from 'vitest';
import { sseFrame } from '../src/app/api/run/sse';
import type { StreamEvent } from '../src/core/types';

describe('sseFrame', () => {
  it('encodes an event as `event: <type>` + single-line JSON `data:` + blank-line terminator', () => {
    const ev: StreamEvent = { type: 'bull_done', arg: { role: 'bull', thesis: 'up', evidenceRefs: [], confidence: 0.6 } };
    const frame = sseFrame(ev);
    expect(frame.startsWith('event: bull_done\n')).toBe(true);
    expect(frame.endsWith('\n\n')).toBe(true);
    const dataLine = frame.split('\n').find((l) => l.startsWith('data: '))!;
    // data must be ONE line (no raw newlines that would break SSE framing)
    expect(dataLine.includes('\n')).toBe(false);
    expect(JSON.parse(dataLine.slice('data: '.length)).type).toBe('bull_done');
  });

  it('error events encode their message without breaking framing', () => {
    const frame = sseFrame({ type: 'error', stage: 'judge', message: 'line1\nline2' });
    // JSON.stringify escapes the newline, so the data line stays single-line
    expect(frame.split('\n').filter((l) => l.startsWith('data: ')).length).toBe(1);
  });
});
