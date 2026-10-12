import type { EvidencePacket } from '../../src/core/types';

// A real historical catalyst packet (same shape packetToPrompt expects). Values illustrative
// but well-formed; the spike measures generation reliability, not numerical accuracy.
export const PACKET: EvidencePacket = {
  symbol: 'RAMZNUSDT', eventType: 'macro', eventDate: '2026-09-11', asOf: '2026-09-08',
  priceContext: { close: 182.4, sma20: 186.1, atr14: 4.2, ret5d: -0.031, vol: 0.28 },
  signals: { macro: 'September FOMC held rates; hawkish dot-plot', technical: 'below 20-day SMA, elevated ATR' },
};
