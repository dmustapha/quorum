import { describe, it, expect } from 'vitest';
import { loadLeakSafeRows } from '../src/core/scoreboard-source';

// Fake rows: 2 isOos:true, 1 isOos:false — assert the false one is filtered out
const fakeEventsJsonl = [
  JSON.stringify({ date: '2024-01-01', symbol: 'BTCUSDT', isOos: true,  panelConv: 0.8, panelAction: 'LONG',     ablConv: 0.7, ablAction: 'LONG',     fwdRet: 0.02, panelPnl: 0.02, panelTraded: true,  ablPnl: 0.02, ablTraded: true  }),
  JSON.stringify({ date: '2024-01-02', symbol: 'ETHUSDT', isOos: true,  panelConv: 0.7, panelAction: 'SHORT',    ablConv: 0.6, ablAction: 'NO_TRADE', fwdRet: -0.01, panelPnl: 0.01, panelTraded: true, ablPnl: 0,    ablTraded: false }),
  JSON.stringify({ date: '2023-12-01', symbol: 'BTCUSDT', isOos: false, panelConv: 0.9, panelAction: 'LONG',     ablConv: 0.8, ablAction: 'LONG',     fwdRet: 0.03, panelPnl: 0.03, panelTraded: true,  ablPnl: 0.03, ablTraded: true  }),
].join('\n');

const fakeSkipped = JSON.stringify(Array(5).fill({ reason: 'no fwd ret' }));

const fakeResult = JSON.stringify({
  verdict: 'PANEL_BEATS_OOS',
  config: { convictionBar: 0.65, oosCutoff: '2024-01-01', horizonDays: 5 },
});

function makeFakeReader(overrides: Record<string, string> = {}) {
  return async (path: string): Promise<string> => {
    if (path.includes('backtest-events.jsonl')) return overrides['events'] ?? fakeEventsJsonl;
    if (path.includes('backtest-skipped.json'))  return overrides['skipped'] ?? fakeSkipped;
    if (path.includes('backtest-result.json'))   return overrides['result'] ?? fakeResult;
    throw new Error(`Unexpected path: ${path}`);
  };
}

describe('loadLeakSafeRows', () => {
  it('filters out isOos:false rows (controller ruling)', async () => {
    const { rows } = await loadLeakSafeRows(makeFakeReader());
    expect(rows.length).toBe(2); // the isOos:false row must be excluded
    expect(rows.every((r) => r.isOos === true)).toBe(true);
  });

  it('returns correct dropped count from skipped array length', async () => {
    const { dropped } = await loadLeakSafeRows(makeFakeReader());
    expect(dropped).toBe(5);
  });

  it('returns verdict and bar from result file', async () => {
    const { verdict, bar } = await loadLeakSafeRows(makeFakeReader());
    expect(verdict).toBe('PANEL_BEATS_OOS');
    expect(bar).toBe(0.65);
  });

  it('returns honest-empty shape when reader throws', async () => {
    const throwingReader = async (_path: string): Promise<string> => {
      throw new Error('file not found');
    };
    const result = await loadLeakSafeRows(throwingReader);
    expect(result.rows.length).toBe(0);
    expect(result.dropped).toBe(0);
    expect(result.verdict).toBe('PANEL_LOSES_OOS');
    expect(result.bar).toBe(0.6);
  });
});
