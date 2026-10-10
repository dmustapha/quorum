import { describe, it, expect } from 'vitest';
import { Backtest, deriveVerdict, outcome, gate, pnlOf, forwardReturn, type BacktestHooks } from '../src/core/backtest';
import { Collector } from '../src/pipeline/collector';
import type { MarketClient } from '../src/adapters/bitget/market';
import type { SignalClient } from '../src/adapters/signal/signal';
import type { Candle, CatalystEvent, EvidencePacket, JudgeVerdict, BacktestConfig } from '../src/core/types';

const DAY = 86_400_000;

// --- synthetic verdict builders (no network) -------------------------------------------------
const verdict = (action: 'LONG' | 'SHORT' | 'NO_TRADE', sizePct = 10, conviction = 0.9): JudgeVerdict => ({
  decision: { action, symbol: 'X', sizePct: action === 'NO_TRADE' ? 0 : sizePct, stopPct: 5, conviction },
  rationale: 'synthetic', minorityOpinion: 'synthetic dissent', convictionBar: 0.6,
});

// 40 daily candles ending the day before `cutoff`, all close=100 (pre-cutoff, visible).
function preCandles(cutoffMs: number, close = 100): Candle[] {
  const out: Candle[] = [];
  for (let i = 40; i >= 1; i--) out.push({ ts: cutoffMs - i * DAY, open: close, high: close + 1, low: close - 1, close, baseVol: 1000, quoteVol: 1e5 });
  return out;
}

const CONFIG: BacktestConfig = {
  universe: ['AAA', 'BBB'], from: '2026-01-01', to: '2026-12-31',
  oosCutoff: '2026-06-01', horizonDays: 3, convictionBar: 0.6,
};

// Collector stubs that reach the REAL Collector cutoff logic (INVARIANT 3 chokepoint).
class FakeSignal { async collect() { return {}; } }
const asSignal = (s: FakeSignal) => s as unknown as SignalClient;

describe('backtest OOS harness', () => {
  // (1) OOS-leak guard: no candle at/after asOf enters the packet. Exercises the real Collector.
  describe('OOS leak guard (DT-5 / INVARIANT 3)', () => {
    it('excludes every candle with ts >= asOf from the packet', async () => {
      const event: CatalystEvent = { symbol: 'AAA', eventType: 'earnings', date: '2026-07-01', description: 'e' };
      const cutoffMs = new Date(event.date + 'T00:00:00Z').getTime();
      // mix pre-cutoff (close=100) with FUTURE candles (close=999) that MUST NOT leak into priceContext.
      const future: Candle[] = [0, 1, 2].map((i) => ({ ts: cutoffMs + i * DAY, open: 999, high: 999, low: 999, close: 999, baseVol: 1, quoteVol: 1 }));
      const candles = [...preCandles(cutoffMs, 100), ...future];
      class FakeMarket { async getCandles(): Promise<Candle[]> { return candles; } }
      const collector = new Collector(new FakeMarket() as unknown as MarketClient, asSignal(new FakeSignal()));

      const packet: EvidencePacket = await collector.collect(event);
      expect(packet.asOf).toBe('2026-07-01');
      // no future price (999) may appear in any price-derived field (vol is volume, not price)
      expect(packet.priceContext.close).toBe(100);
      expect(packet.priceContext.sma20).toBe(100);
      for (const field of ['close', 'sma20', 'atr14', 'ret5d'] as const) {
        expect(packet.priceContext[field]).toBeLessThan(999);
      }
    });

    it('throws OOS_LEAK_GUARD when fewer than 21 pre-cutoff candles exist', async () => {
      const event: CatalystEvent = { symbol: 'AAA', eventType: 'earnings', date: '2026-07-01', description: 'e' };
      const cutoffMs = new Date(event.date + 'T00:00:00Z').getTime();
      const candles = preCandles(cutoffMs).slice(-5); // only 5 visible
      class FakeMarket { async getCandles(): Promise<Candle[]> { return candles; } }
      const collector = new Collector(new FakeMarket() as unknown as MarketClient, asSignal(new FakeSignal()));
      await expect(collector.collect(event)).rejects.toThrow('OOS_LEAK_GUARD');
    });
  });

  // Shared harness builder: injects packet (bypass collector), synthetic verdicts, synthetic fwd.
  function harness(hooks: BacktestHooks) {
    const stubCollector = { collect: async (e: CatalystEvent): Promise<EvidencePacket> => ({
      symbol: e.symbol, eventDate: e.date, eventType: e.eventType,
      priceContext: { close: 100, sma20: 100, atr14: 1, ret5d: 0, vol: 1 }, signals: {}, asOf: e.date,
    }) } as unknown as Collector;
    return new Backtest(stubCollector, undefined, undefined, hooks);
  }

  // (2) Partition integrity: IS metrics are UNCHANGED when OOS events are added.
  describe('IS/OOS partition integrity', () => {
    const isEvents: CatalystEvent[] = [
      { symbol: 'AAA', eventType: 'earnings', date: '2026-03-01', description: 'is-1' },
      { symbol: 'BBB', eventType: 'earnings', date: '2026-04-01', description: 'is-2' },
    ];
    const oosEvents: CatalystEvent[] = [
      { symbol: 'AAA', eventType: 'earnings', date: '2026-08-01', description: 'oos-1' },
      { symbol: 'BBB', eventType: 'earnings', date: '2026-09-01', description: 'oos-2' },
    ];
    const hooks: BacktestHooks = {
      panelVerdict: async () => verdict('LONG', 10),
      ablationVerdict: async () => verdict('LONG', 10),
      forward: async () => 2, // +2% fwd, LONG → +2% directional
    };

    it('leaves IS metrics identical whether or not OOS events are present', async () => {
      const isOnly = await harness(hooks).run(CONFIG, isEvents);
      const both = await harness(hooks).run(CONFIG, [...isEvents, ...oosEvents]);
      expect(both.panel.is).toEqual(isOnly.panel.is);
      expect(both.ablation.is).toEqual(isOnly.ablation.is);
      // and the OOS partition is populated only in the combined run
      expect(isOnly.panel.oos.events).toBe(0);
      expect(both.panel.oos.events).toBe(2);
    });
  });

  // (3) Verdict is computed by the avg-P&L comparison rule — directional, tie-broken by hit-rate.
  describe('verdict rule', () => {
    it('PANEL_BEATS_OOS when panel OOS avg-P&L exceeds ablation', async () => {
      const oos: CatalystEvent[] = [{ symbol: 'AAA', eventType: 'earnings', date: '2026-08-01', description: 'o' }];
      const hooks: BacktestHooks = {
        panelVerdict: async () => verdict('LONG', 10),    // +2% fwd → +0.2%
        ablationVerdict: async () => verdict('SHORT', 10), // -2% sized → -0.2%
        forward: async () => 2,
      };
      const r = await harness(hooks).run(CONFIG, oos);
      expect(r.panel.oos.avgPnlPct).toBeGreaterThan(r.ablation.oos.avgPnlPct);
      expect(r.verdict).toBe('PANEL_BEATS_OOS');
    });

    it('PANEL_LOSES_OOS when ablation OOS avg-P&L exceeds panel', async () => {
      const oos: CatalystEvent[] = [{ symbol: 'AAA', eventType: 'earnings', date: '2026-08-01', description: 'o' }];
      const hooks: BacktestHooks = {
        panelVerdict: async () => verdict('SHORT', 10),
        ablationVerdict: async () => verdict('LONG', 10),
        forward: async () => 2,
      };
      const r = await harness(hooks).run(CONFIG, oos);
      expect(r.verdict).toBe('PANEL_LOSES_OOS');
    });

    it('deriveVerdict: equal avg breaks tie on hit-rate; equal both = LOSES (not strictly greater)', () => {
      expect(deriveVerdict(1, 1, 0.9, 0.1)).toBe('PANEL_BEATS_OOS');
      expect(deriveVerdict(1, 1, 0.5, 0.5)).toBe('PANEL_LOSES_OOS');
      expect(deriveVerdict(0.5, 0.4)).toBe('PANEL_BEATS_OOS');
    });
  });

  // (4) Code-level gate: SAME raw rows re-gated under a DIFFERENT bar → different traded counts.
  describe('code-level re-gate (bar is a CODE policy, not an LLM prompt)', () => {
    it('gate/pnlOf: same raw conviction, different bar → different traded + pnl', () => {
      // raw LONG @ 0.58 trades under bar 0.55 but NOT under bar 0.60 — no LLM re-call needed
      expect(gate('LONG', 0.58, 0.55)).toEqual({ traded: true, action: 'LONG' });
      expect(gate('LONG', 0.58, 0.6)).toEqual({ traded: false, action: 'NO_TRADE' });
      expect(pnlOf('LONG', 0.58, 0.55, 3)).toBe(3);
      expect(pnlOf('LONG', 0.58, 0.6, 3)).toBe(0);
      expect(pnlOf('SHORT', 0.58, 0.55, 3)).toBe(-3);
      // bar<=0 (bar-free) → any directional action trades
      expect(gate('LONG', 0.1, 0).traded).toBe(true);
      expect(gate('NO_TRADE', 0.99, 0)).toEqual({ traded: false, action: 'NO_TRADE' });
    });

    it('re-gating the SAME harness rows under two bars yields different traded counts', async () => {
      // one OOS event, raw conviction 0.58 (just under 0.60, over 0.55) — the real backtest symptom
      const oos: CatalystEvent[] = [{ symbol: 'AAA', eventType: 'earnings', date: '2026-08-01', description: 'o' }];
      const hooks: BacktestHooks = {
        panelVerdict: async () => verdict('LONG', 10, 0.58),
        ablationVerdict: async () => verdict('LONG', 10, 0.58),
        forward: async () => 2,
      };
      const high = await harness(hooks).run({ ...CONFIG, convictionBar: 0.6 }, oos);
      const low = await harness(hooks).run({ ...CONFIG, convictionBar: 0.55 }, oos);
      // RAW rows are identical (same conviction/action); only the CODE bar differs
      expect(high.panel.oos.trades).toBe(0);  // 0.58 < 0.60 → no trade
      expect(low.panel.oos.trades).toBe(1);   // 0.58 >= 0.55 → trades
      expect(low.panel.oos.avgPnlPct).toBe(2); // directional +2%
    });

    it('EventRow stores the RAW action+conviction+fwdRet alongside the gated pnl', async () => {
      const oos: CatalystEvent[] = [{ symbol: 'AAA', eventType: 'earnings', date: '2026-08-01', description: 'o' }];
      const bt = harness({
        panelVerdict: async () => verdict('LONG', 10, 0.58),
        ablationVerdict: async () => verdict('SHORT', 10, 0.72),
        forward: async () => 2,
      });
      await bt.run({ ...CONFIG, convictionBar: 0.6 }, oos);
      const row = bt.eventRows[0];
      expect(row.panelAction).toBe('LONG');
      expect(row.panelConv).toBe(0.58);
      expect(row.ablAction).toBe('SHORT');
      expect(row.ablConv).toBe(0.72);
      expect(row.fwdRet).toBe(2);
      // gated under bar 0.6: panel 0.58<0.6 not-traded; ablation 0.72>=0.6 SHORT → -2%
      expect(row.panelTraded).toBe(false);
      expect(row.panelPnl).toBe(0);
      expect(row.ablTraded).toBe(true);
      expect(row.ablPnl).toBe(-2);
    });

    it('OOS-leak guard still holds with the richer rows (IS unchanged by OOS presence)', async () => {
      const isEvents: CatalystEvent[] = [{ symbol: 'AAA', eventType: 'earnings', date: '2026-03-01', description: 'is' }];
      const oosEvents: CatalystEvent[] = [{ symbol: 'BBB', eventType: 'earnings', date: '2026-08-01', description: 'oos' }];
      const hooks: BacktestHooks = {
        panelVerdict: async () => verdict('LONG', 10, 0.9),
        ablationVerdict: async () => verdict('LONG', 10, 0.9),
        forward: async () => 2,
      };
      const isOnly = await harness(hooks).run(CONFIG, isEvents);
      const both = await harness(hooks).run(CONFIG, [...isEvents, ...oosEvents]);
      expect(both.panel.is).toEqual(isOnly.panel.is);
      expect(both.panel.oos.events).toBe(1);
    });
  });

  // Edge + error cases ------------------------------------------------------------------------
  describe('edges', () => {
    it('skips events outside [from,to] or off-universe, and events whose collect() throws', async () => {
      const events: CatalystEvent[] = [
        { symbol: 'AAA', eventType: 'earnings', date: '2025-01-01', description: 'before-window' },
        { symbol: 'ZZZ', eventType: 'earnings', date: '2026-08-01', description: 'off-universe' },
        { symbol: 'AAA', eventType: 'earnings', date: '2026-08-01', description: 'throws' },
      ];
      const throwingCollector = { collect: async () => { throw new Error('OOS_LEAK_GUARD'); } } as unknown as Collector;
      const bt = new Backtest(throwingCollector, undefined, undefined, {
        panelVerdict: async () => verdict('LONG'), ablationVerdict: async () => verdict('LONG'), forward: async () => 1,
      });
      const r = await bt.run(CONFIG, events);
      expect(bt.eventRows).toHaveLength(0); // all three skipped
      expect(r.panel.oos.events).toBe(0);
    });

    it('null forward return → not traded, pnl 0 (never interpolated)', () => {
      expect(outcome(verdict('LONG', 10), null, 0.6)).toEqual({ traded: false, pnlPct: 0 });
      expect(outcome(verdict('NO_TRADE'), 5, 0.6)).toEqual({ traded: false, pnlPct: 0 });
    });

    it('outcome is directional (LONG=+fwd, SHORT=-fwd) and gated by the CODE bar', () => {
      // raw conviction 0.9 clears bar 0.6 → trades; directional, no sizePct scaling
      expect(outcome(verdict('LONG', 10, 0.9), 2, 0.6)).toEqual({ traded: true, pnlPct: 2 });
      expect(outcome(verdict('SHORT', 10, 0.9), 2, 0.6)).toEqual({ traded: true, pnlPct: -2 });
      // raw conviction 0.55 is BELOW bar 0.6 → not traded, pnl 0 (the live-backtest NO_TRADE case)
      expect(outcome(verdict('LONG', 10, 0.55), 2, 0.6)).toEqual({ traded: false, pnlPct: 0 });
    });

    it('maxEvents caps the number of events processed (budget throttle)', async () => {
      const events: CatalystEvent[] = [
        { symbol: 'AAA', eventType: 'earnings', date: '2026-07-01', description: '1' },
        { symbol: 'BBB', eventType: 'earnings', date: '2026-08-01', description: '2' },
        { symbol: 'AAA', eventType: 'earnings', date: '2026-09-01', description: '3' },
      ];
      const bt = harness({ panelVerdict: async () => verdict('LONG'), ablationVerdict: async () => verdict('LONG'), forward: async () => 1 });
      const r = await bt.run(CONFIG, events, 2);
      expect(bt.eventRows).toHaveLength(2);
      expect(r.panel.oos.events).toBe(2);
    });

    it('forwardReturn returns null when insufficient forward candles exist', async () => {
      const cutoffMs = new Date('2026-07-01T00:00:00Z').getTime();
      const market = { getCandles: async (): Promise<Candle[]> => preCandles(cutoffMs) }; // nothing at/after cutoff
      expect(await forwardReturn(market, 'AAA', '2026-07-01', 3)).toBeNull();
    });

    it('forwardReturn computes signed % from entry to exit candle', async () => {
      const cutoffMs = new Date('2026-07-01T00:00:00Z').getTime();
      const candles: Candle[] = [0, 1, 2, 3].map((i) => ({ ts: cutoffMs + i * DAY, open: 100, high: 100, low: 100, close: 100 + i * 10, baseVol: 1, quoteVol: 1 }));
      const market = { getCandles: async (): Promise<Candle[]> => candles };
      // entry idx0 close=100, exit idx3 close=130 → +30%
      expect(await forwardReturn(market, 'AAA', '2026-07-01', 3)).toBeCloseTo(30, 6);
    });
  });
});
