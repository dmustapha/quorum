// File: scripts/cache-candles.ts
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { MarketClient } from '../src/adapters/bitget/market';
import universe from '../data/universe.json';

async function main() {
  const market = new MarketClient(false); // force live
  const dir = path.join(process.cwd(), 'data', 'candles-cache');
  await mkdir(dir, { recursive: true });
  for (const symbol of universe as string[]) {
    const candles = await market.getCandles(symbol, '1day', 400);
    await writeFile(path.join(dir, `${symbol}-1day.json`), JSON.stringify(candles));
    console.log(`cached ${symbol}: ${candles.length} candles`);
    await new Promise((r) => setTimeout(r, 150));
  }
}
main();
