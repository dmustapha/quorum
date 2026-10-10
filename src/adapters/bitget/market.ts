// File: src/adapters/bitget/market.ts
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Candle } from '../../core/types';

const BASE = 'https://api.bitget.com/api/v2/spot/market';
const CACHE_DIR = path.join(process.cwd(), 'data', 'candles-cache');

function parseCandles(raw: string[][]): Candle[] {
  // Bitget row: [ts, open, high, low, close, baseVol, quoteVol, usdtVol]
  return raw.map((r) => ({
    ts: Number(r[0]),
    open: Number(r[1]), high: Number(r[2]), low: Number(r[3]), close: Number(r[4]),
    baseVol: Number(r[5]), quoteVol: Number(r[6]),
  })).sort((a, b) => a.ts - b.ts);
}

async function getJson(url: string): Promise<any> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url);
    if (res.ok) {
      const j = await res.json();
      if (j.code === '00000') return j;
    }
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1))); // backoff
  }
  throw new Error(`Bitget request failed after retries: ${url}`);
}

export class MarketClient {
  constructor(private readonly useCache = true) {}

  async getCandles(symbol: string, granularity: '1day' | '1h' = '1day', limit = 200): Promise<Candle[]> {
    if (this.useCache) {
      try {
        const file = path.join(CACHE_DIR, `${symbol}-${granularity}.json`);
        const cached = JSON.parse(await readFile(file, 'utf8')) as Candle[];
        if (cached.length) return cached;
      } catch { /* fall through to live */ }
    }
    const j = await getJson(`${BASE}/candles?symbol=${symbol}&granularity=${granularity}&limit=${limit}`);
    if (!Array.isArray(j.data) || j.data.length === 0) throw new Error(`No candles for ${symbol}`);
    return parseCandles(j.data);
  }

  async listRTokens(): Promise<string[]> {
    const j = await getJson(`${BASE}/tickers`);
    return (j.data as Array<{ symbol: string }>)
      .map((t) => t.symbol)
      .filter((s) => s.startsWith('R') && s.endsWith('USDT'));
  }
}
