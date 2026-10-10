// File: src/core/executor.ts
// The SOLE order path (INVARIANT 1, structural). `execute` accepts a JudgeVerdict and NOTHING
// else — there is no placeOrder(symbol, side, size) public surface anywhere. Remove the
// Panel+Judge and no order can be constructed.

import type { JudgeVerdict, OrderResult } from './types';
import { AgentHub } from '../adapters/bitget/agenthub';
import { MarketClient } from '../adapters/bitget/market';

export class Executor {
  constructor(
    private readonly hub: AgentHub,
    private readonly market = new MarketClient(),
  ) {}

  async execute(verdict: JudgeVerdict): Promise<OrderResult> {
    const d = verdict.decision;
    if (d.action === 'NO_TRADE') return { status: 'skipped', reason: 'NO_TRADE' };

    // Defense-in-depth: a hand-crafted non-NO_TRADE decision below the bar is rejected
    // fail-closed (NO_VERDICT_NO_ORDER guard, INVARIANT 1 / threat T2).
    if (d.conviction < verdict.convictionBar) return { status: 'skipped', reason: 'NO_TRADE' };

    // Execution-constraint honesty (refined-C): Bitget lists rTokens SPOT-ONLY — there is no
    // futures/borrow venue to short them. A SHORT decision is a real, risk-managed ADVISORY signal
    // (the agent decided; dissent is preserved) but is NOT Bitget-executable. We surface that
    // honestly rather than fabricate a fill. LONG decisions proceed to a real spot buy.
    if (d.action === 'SHORT') {
      return {
        status: 'advisory',
        reason: 'SPOT_LONG_ONLY',
        note: `SHORT ${d.symbol} (conviction ${d.conviction}, stop ${d.stopPct}%) — risk-managed advisory signal; Bitget rTokens are spot-only so this is not live-fillable. No order placed; no fill fabricated.`,
      };
    }

    // entryPrice = latest candle close — the reference for the absolute stop-loss price.
    const candles = await this.market.getCandles(d.symbol, '1day', 2);
    const entryPrice = candles[candles.length - 1].close;

    return this.hub.placePaperOrder({
      symbol: d.symbol,
      side: d.action === 'LONG' ? 'buy' : 'sell',
      sizePct: d.sizePct,
      stopPct: d.stopPct,
      entryPrice,
    });
  }
}
