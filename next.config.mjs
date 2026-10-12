/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: import.meta.dirname,
  // Vercel serverless only bundles traced files. These are read at runtime via fs
  // (not static imports), so they must be explicitly included per route or the pages
  // render empty / the hero flow 502s. Seed decisions, the committed LLM cache (powers
  // the offline hero flow), candle cache, and CLAIMS.md all live outside the JS graph.
  outputFileTracingIncludes: {
    '/': ['./evidence/**'],
    '/app': ['./evidence/**', './data/**'],
    '/app/decision/[id]': ['./evidence/**'],
    '/backtest': ['./evidence/**', './data/**'],
    '/proof': ['./CLAIMS.md', './evidence/**'],
    '/api/run': ['./.llm-cache/**', './data/**', './evidence/**'],
    '/api/decisions': ['./evidence/**'],
    '/api/scoreboard': ['./evidence/**'],
    '/browse': ['./evidence/**'],
    '/browse/compare': ['./evidence/**'],
    '/api/backtest': ['./evidence/**', './data/**', './.llm-cache/**'],
    '/api/proof': ['./CLAIMS.md'],
  },
};

export default nextConfig;
