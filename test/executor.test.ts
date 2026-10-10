import { describe, it, expect } from 'vitest';
import { Executor } from '../src/core/executor';
import { AgentHub, stopPctToPrice, type PaperOrderReq } from '../src/adapters/bitget/agenthub';
import type { MarketClient } from '../src/adapters/bitget/market';
import type { Candle, JudgeVerdict, OrderResult } from '../src/core/types';

// Spy AgentHub: records calls, never touches the SDK/network.
class SpyHub {
  calls: PaperOrderReq[] = [];
  async placePaperOrder(req: PaperOrderReq): Promise<OrderResult> {
    this.calls.push(req);
    return { status: 'accepted', raw: { orderId: 'PAPER-1' }, orderId: 'PAPER-1' };
  }
}
// Fake MarketClient: fixed latest candle close = entryPrice.
class FakeMarket {
  async getCandles(): Promise<Candle[]> {
    return [{ ts: 1, open: 100, high: 100, low: 100, close: 200, baseVol: 0, quoteVol: 0 }];
  }
}

const asHub = (h: SpyHub) => h as unknown as AgentHub;
const asMarket = (m: FakeMarket) => m as unknown as MarketClient;

const verdict = (over: Partial<JudgeVerdict['decision']>, bar = 0.6): JudgeVerdict => ({
  decision: { action: 'LONG', symbol: 'RNVDAUSDT', sizePct: 5, stopPct: 10, conviction: 0.8, ...over },
  rationale: 'r', minorityOpinion: 'm', convictionBar: bar,
});

describe('Executor', () => {
  // EDGE: NO_TRADE never touches the hub.
  it('skips on NO_TRADE and never calls the hub', async () => {
    const hub = new SpyHub();
    const r = await new Executor(asHub(hub), asMarket(new FakeMarket())).execute(
      verdict({ action: 'NO_TRADE', sizePct: 0, stopPct: 0 }),
    );
    expect(r).toEqual({ status: 'skipped', reason: 'NO_TRADE' });
    expect(hub.calls.length).toBe(0);
  });

  // ERROR / defense: a hand-crafted below-bar non-NO_TRADE decision is rejected fail-closed.
  it('skips a below-bar LONG (NO_VERDICT_NO_ORDER) without calling the hub', async () => {
    const hub = new SpyHub();
    const r = await new Executor(asHub(hub), asMarket(new FakeMarket())).execute(
      verdict({ action: 'LONG', conviction: 0.3 }),
    );
    expect(r.status).toBe('skipped');
    expect(hub.calls.length).toBe(0);
  });

  // HAPPY: above-bar LONG → one hub call carrying the correct side/entryPrice.
  it('places a paper order for an above-bar LONG with entryPrice from latest candle', async () => {
    const hub = new SpyHub();
    const r = await new Executor(asHub(hub), asMarket(new FakeMarket())).execute(verdict({}));
    expect(r.status).toBe('accepted');
    expect(hub.calls.length).toBe(1);
    expect(hub.calls[0].side).toBe('buy');
    expect(hub.calls[0].entryPrice).toBe(200);
  });

  // ADVISORY (refined-C): above-bar SHORT → honest advisory, NO hub call, NO fabricated fill.
  // rTokens are spot-only so a short is not Bitget-executable; the agent still DECIDED.
  it('returns an honest advisory (no order) for an above-bar SHORT — spot is long-only', async () => {
    const hub = new SpyHub();
    const r = await new Executor(asHub(hub), asMarket(new FakeMarket())).execute(verdict({ action: 'SHORT' }));
    expect(r.status).toBe('advisory');
    if (r.status === 'advisory') expect(r.reason).toBe('SPOT_LONG_ONLY');
    expect(hub.calls.length).toBe(0); // never reached the order path
  });
});

describe('stopPctToPrice (critique-fix: percent → absolute)', () => {
  it('LONG stop is below entry: entry*(1 - stopPct/100)', () => {
    expect(stopPctToPrice('buy', 200, 10)).toBeCloseTo(180, 6);
  });
  it('SHORT stop is above entry: entry*(1 + stopPct/100)', () => {
    expect(stopPctToPrice('sell', 200, 10)).toBeCloseTo(220, 6);
  });
});
