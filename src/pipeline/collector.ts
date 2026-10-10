// File: src/pipeline/collector.ts
// Assembles the EvidencePacket under a STRICT asOf cutoff. This is the SINGLE chokepoint
// where candles are read for a packet, so the `c.ts < cutoffMs` filter is the only place
// OOS leakage can be enforced or violated (INVARIANT 3).

import type { Candle, CatalystEvent, EvidencePacket, PriceContext } from '../core/types';
import { MarketClient } from '../adapters/bitget/market';
import { SignalClient, type SignalBundle } from '../adapters/signal/signal';

function sma(cs: Candle[], n: number): number {
  const slice = cs.slice(-n);
  return slice.reduce((s, c) => s + c.close, 0) / Math.max(1, slice.length);
}

function atr(cs: Candle[], n: number): number {
  const slice = cs.slice(-n - 1);
  let sum = 0, count = 0;
  for (let i = 1; i < slice.length; i++) {
    const tr = Math.max(
      slice[i].high - slice[i].low,
      Math.abs(slice[i].high - slice[i - 1].close),
      Math.abs(slice[i].low - slice[i - 1].close),
    );
    sum += tr; count++;
  }
  return count ? sum / count : 0;
}

// Directional technical read derived ONLY from pre-asOf candles (INVARIANT 3 — no leak). Gives the
// panel concrete directional evidence (trend/momentum/vol) to argue a LONG/SHORT thesis from, rather
// than abstaining for lack of a signal. Purely computed from committed OHLCV — not fabricated.
function technicalSignal(visible: Candle[]): string {
  const close = visible[visible.length - 1].close;
  const s20 = sma(visible, 20), s50 = sma(visible, 50);
  const ret = (n: number): number => {
    const base = visible[visible.length - 1 - n];
    return base ? (close - base.close) / base.close * 100 : 0;
  };
  const ret5 = ret(5), ret20 = ret(20);
  const vsSma20 = (close - s20) / s20 * 100;
  const atrPct = atr(visible, 14) / close * 100;
  const trend = close > s20 && s20 > s50 ? 'UPTREND' : close < s20 && s20 < s50 ? 'DOWNTREND' : 'MIXED';
  const bias = trend === 'UPTREND' && ret20 > 0 ? 'bullish' : trend === 'DOWNTREND' && ret20 < 0 ? 'bearish' : 'neutral';
  return `Trend ${trend} (close ${vsSma20.toFixed(1)}% vs SMA20; SMA20 ${(s20 > s50 ? 'above' : 'below')} SMA50). `
    + `Momentum 20d ${ret20.toFixed(1)}%, 5d ${ret5.toFixed(1)}%. Volatility ATR14 ${atrPct.toFixed(1)}% of price. `
    + `Technical bias: ${bias}.`;
}

/** Strip adapter-internal diagnostics so the packet matches the EvidencePacket schema exactly. */
function cleanSignals(b: SignalBundle): EvidencePacket['signals'] {
  const { _suppressed, ...rest } = b;
  void _suppressed;
  return rest;
}

export class Collector {
  constructor(
    private readonly market = new MarketClient(),
    private readonly signal = new SignalClient(),
  ) {}

  async collect(event: CatalystEvent): Promise<EvidencePacket> {
    const asOf = event.date; // strict cutoff — the catalyst date
    const all = await this.market.getCandles(event.symbol, '1day', 400);
    const cutoffMs = new Date(asOf + 'T00:00:00Z').getTime();

    // INVARIANT 3: never show the panel any candle at/after the catalyst date.
    const visible = all.filter((c) => c.ts < cutoffMs);
    if (visible.length < 21) {
      throw new Error(`OOS_LEAK_GUARD: insufficient pre-cutoff candles for ${event.symbol}@${asOf}`);
    }

    const last = visible[visible.length - 1];
    const base5 = visible[visible.length - 6];
    const ret5d = visible.length >= 6 ? (last.close - base5.close) / base5.close : 0;

    const priceContext: PriceContext = {
      close: last.close,
      sma20: sma(visible, 20),
      atr14: atr(visible, 14),
      ret5d,
      vol: last.baseVol,
    };

    // asOf gates signal leakage: past asOf → external signals suppressed {} (INVARIANT 3 signal leg).
    const signals = cleanSignals(await this.signal.collect(event.symbol, asOf));
    // ...but a technical read computed from the SAME pre-cutoff candles is leak-safe and always
    // available — it gives the panel directional evidence without touching any post-asOf data.
    signals.technical = technicalSignal(visible);

    return {
      symbol: event.symbol,
      eventDate: asOf,
      eventType: event.eventType,
      priceContext,
      signals,
      asOf,
    };
  }
}
