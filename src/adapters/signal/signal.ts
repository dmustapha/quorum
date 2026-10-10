// File: src/adapters/signal/signal.ts
// bitget-signal wrapper: 5 no-key skills → best-effort signal strings.
// A failed signal is OMITTED, never fabricated (INVARIANT 2).
//
// CRITIQUE-FIX OOS-LEAK: collect() takes `asOf` and enforces it. bitget-signal has NO
// point-in-time history, so for a past `asOf` (backtest) every signal would leak future
// information. We therefore SUPPRESS all signals unless asOf == today (live path). The
// un-cuttable signal is omitted honestly rather than leaked (INVARIANT 3, signal leg).
// Package is the SCOPED name `@bitget-ai/bitget-signal` (bare name is 404).

export interface SignalBundle {
  sentiment?: string;
  news?: string[];
  technical?: string;
  macro?: string;
  /** Diagnostics: why signals were omitted (never leaks data; aids the degradation audit). */
  _suppressed?: 'OOS_PAST_ASOF' | 'PACKAGE_MISSING';
}

type SignalFn = (symbol: string) => Promise<string>;

// Lazy-load so a missing package in dev/CI/serverless-build does not crash the core.
// The specifier is held in a variable + webpackIgnore so the bundler does NOT try to
// resolve it at build time (it is intentionally uninstalled, DEV-009). At runtime the
// native import throws "module not found" → caught → PACKAGE_MISSING.
async function loadSignal(): Promise<Record<string, SignalFn> | null> {
  try {
    const pkg = '@bitget-ai/bitget-signal';
    const mod = await import(/* webpackIgnore: true */ pkg);
    return (mod?.default ?? mod) as unknown as Record<string, SignalFn>;
  } catch {
    return null; // signals omitted; packet still valid
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export class SignalClient {
  async collect(symbol: string, asOf: string): Promise<SignalBundle> {
    // OOS guard: anything earlier than today cannot be reconstructed point-in-time → suppress.
    if (asOf < today()) return { _suppressed: 'OOS_PAST_ASOF' };

    const mod = await loadSignal();
    if (!mod) return { _suppressed: 'PACKAGE_MISSING' };

    const safe = async (name: string): Promise<string | undefined> => {
      try {
        return await (mod[name] as SignalFn | undefined)?.(symbol);
      } catch {
        return undefined; // one skill failing omits only that field
      }
    };

    const [sentiment, technical, macro, newsRaw] = await Promise.all([
      safe('sentiment'),
      safe('technical'),
      safe('macro'),
      safe('news'),
    ]);

    return {
      sentiment,
      technical,
      macro,
      news: newsRaw ? [newsRaw] : undefined,
    };
  }
}
