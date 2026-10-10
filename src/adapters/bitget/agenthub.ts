// File: src/adapters/bitget/agenthub.ts
// Thin wrapper over the Bitget Agent Hub paper-order path. Interface is stable; the order is
// placed through the REAL SDK surface — `@bitget-ai/bitget-agent-sdk@3.3.1` is a catalog/MCP
// client (BitgetRestClient.callOperation / composite tools), NOT a simple `.strategy_order()`
// method object as the forge ARCH §22 assumed (see DEV-009). The composite tool `strategy_order`
// maps to catalog operation `placeStrategyOrder` (market order + preset SL). Any failure degrades
// to an honest rejection — NEVER a fabricated fill (INVARIANT 2).
//
// DT-4 (pending Agentic-Account OAuth + a non-empty LLM key): the exact `placeStrategyOrder` arg
// field names + units must be pinned against the installed CATALOG via `discover({tool:'strategy_order'})`
// and exercised once live (this run has no OAuth creds, so the live call is UNTESTED).
//
// CRITIQUE-FIX (stopPct → absolute price, MAJOR): Bitget's `presetStopLossPrice` expects an
// ABSOLUTE price level, not a percent. The Executor supplies `entryPrice` (latest candle close)
// and we convert here:
//     LONG  (side 'buy'):  stop = entry * (1 - stopPct/100)   // stop below entry
//     SHORT (side 'sell'): stop = entry * (1 + stopPct/100)   // stop above entry
// Shipping the raw percent would place a nonsense stop. The conversion is unit-tested.

import type { OrderResult } from '../../core/types';
import type { BitgetConfig } from '@bitget-ai/bitget-agent-sdk';

export interface PaperOrderReq {
  symbol: string;
  side: 'buy' | 'sell';
  sizePct: number;
  stopPct: number;
  /** Latest pre-decision candle close — the reference for the absolute stop-loss price. */
  entryPrice: number;
}

/** Convert a percent stop offset to the absolute price Bitget expects. Exported for unit tests. */
export function stopPctToPrice(side: 'buy' | 'sell', entryPrice: number, stopPct: number): number {
  const frac = stopPct / 100;
  return side === 'buy' ? entryPrice * (1 - frac) : entryPrice * (1 + frac);
}

export class AgentHub {
  private readonly paper = (process.env.BITGET_PAPER_TRADING ?? 'true') === 'true';

  async placePaperOrder(req: PaperOrderReq): Promise<OrderResult> {
    const presetStopLossPrice = stopPctToPrice(req.side, req.entryPrice, req.stopPct);
    try {
      const sdk = await import('@bitget-ai/bitget-agent-sdk');
      // Agentic-Account creds: when OAuth has run, loadCredentials() reads the saved session;
      // env keys are the read-only/paper fallback. Cast to BitgetConfig — the SDK validates fields.
      const config = {
        apiKey: process.env.BITGET_API_KEY,
        apiSecret: process.env.BITGET_API_SECRET,
        passphrase: process.env.BITGET_PASSPHRASE,
        paperTrading: this.paper, // --paper-trading → Bitget Demo
      } as unknown as BitgetConfig;
      const client = new sdk.BitgetRestClient(config);
      // Composite `strategy_order` → catalog op `placeStrategyOrder`. Arg field names/units are
      // DT-4-pinned (discover({tool:'strategy_order'})) once the Agentic account is connected.
      const { data: raw } = await client.callOperation('placeStrategyOrder', {
        symbol: req.symbol,
        side: req.side,
        orderType: 'market',
        size: req.sizePct, // notional %; units pinned at DT-4
        presetStopLossPrice, // ABSOLUTE price, converted above
      });
      return { status: 'accepted', raw, orderId: (raw as { orderId?: string })?.orderId };
    } catch (e) {
      // ORDER_REJECTED — audit the real failure, never a stored-success substitute (INVARIANT 2).
      return { status: 'rejected', raw: null, error: String(e) };
    }
  }
}
