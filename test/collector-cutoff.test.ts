import { describe, it, expect } from 'vitest';
import { Collector } from '../src/pipeline/collector';
import type { MarketClient } from '../src/adapters/bitget/market';
import type { SignalClient } from '../src/adapters/signal/signal';
import type { Candle, CatalystEvent } from '../src/core/types';

const DAY = 86_400_000;
const CUTOFF = new Date('2026-02-25T00:00:00Z').getTime();

// Build 40 pre-cutoff daily candles ending the day before the cutoff, each close = 100.
function preCandles(): Candle[] {
  const out: Candle[] = [];
  for (let i = 40; i >= 1; i--) {
    const ts = CUTOFF - i * DAY;
    out.push({ ts, open: 100, high: 101, low: 99, close: 100, baseVol: 1000, quoteVol: 100000 });
  }
  return out;
}

class FakeMarket {
  constructor(private readonly candles: Candle[]) {}
  async getCandles(): Promise<Candle[]> { return this.candles; }
}
// Signals suppressed (asOf in the past) — return empty, as the real client would.
class FakeSignal { async collect() { return {}; } }

const asMarket = (m: FakeMarket) => m as unknown as MarketClient;
const asSignal = (s: FakeSignal) => s as unknown as SignalClient;

const event: CatalystEvent = {
  symbol: 'RNVDAUSDT', eventType: 'earnings', date: '2026-02-25', description: 'test',
};

describe('Collector strict asOf cutoff (INVARIANT 3)', () => {
  // HAPPY + CORE INVARIANT: a candle AT/AFTER the cutoff must not change any priceContext field.
  it('ignores candles with ts >= cutoff — priceContext is identical with or without them', async () => {
    const base = preCandles();
    const leaky: Candle[] = [
      ...base,
      // future candle with a wildly different close that WOULD move sma/close if leaked
      { ts: CUTOFF, open: 999, high: 1200, low: 900, close: 999, baseVol: 9e9, quoteVol: 9e9 },
      { ts: CUTOFF + DAY, open: 999, high: 1200, low: 900, close: 999, baseVol: 9e9, quoteVol: 9e9 },
    ];

    const clean = await new Collector(asMarket(new FakeMarket(base)), asSignal(new FakeSignal())).collect(event);
    const withFuture = await new Collector(asMarket(new FakeMarket(leaky)), asSignal(new FakeSignal())).collect(event);

    expect(withFuture.priceContext).toEqual(clean.priceContext);
    expect(withFuture.priceContext.close).toBe(100); // not 999
    expect(withFuture.asOf).toBe('2026-02-25');
  });

  // ERROR: fewer than 21 pre-cutoff candles → OOS_LEAK_GUARD throw (never compute on thin history).
  it('throws OOS_LEAK_GUARD when fewer than 21 pre-cutoff candles are visible', async () => {
    const thin = preCandles().slice(-10); // only 10 visible
    const c = new Collector(asMarket(new FakeMarket(thin)), asSignal(new FakeSignal()));
    await expect(c.collect(event)).rejects.toThrow(/OOS_LEAK_GUARD/);
  });

  // EDGE: external signals (sentiment/news/macro) suppressed for a past asOf (leak guard), but a
  // technical read from the SAME pre-cutoff candles is leak-safe and present — packet still valid.
  it('suppresses external signals but includes a leak-safe technical read for a past asOf', async () => {
    const p = await new Collector(asMarket(new FakeMarket(preCandles())), asSignal(new FakeSignal())).collect(event);
    expect(p.signals.sentiment).toBeUndefined();
    expect(p.signals.news).toBeUndefined();
    expect(p.signals.macro).toBeUndefined();
    expect(typeof p.signals.technical).toBe('string');
    expect(p.signals.technical).toMatch(/Technical bias:/);
    expect(p.priceContext.sma20).toBe(100);
  });
});
