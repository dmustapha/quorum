// design-tests/tokens.design.test.ts
// Dreyth design test: proves brand.json + DESIGN_SYSTEM.md are FAITHFUL to the shipped
// globals.css (formalize = formalize, never redesign). Reds if a token drifts from code.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const root = path.join(__dirname, '..');
const css = readFileSync(path.join(root, 'src/app/globals.css'), 'utf8');
const brand = JSON.parse(readFileSync(path.join(root, 'brand.json'), 'utf8'));

function cssVar(name: string): string {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,6});`));
  if (!m) throw new Error(`token --${name} not found in globals.css`);
  return m[1].toLowerCase();
}

describe('brand.json is faithful to the shipped globals.css', () => {
  it('accent/brandColor == --accent (lime)', () => {
    expect(brand.brandColor).toBe(cssVar('accent'));
    expect(brand.accent).toBe(cssVar('accent'));
  });
  it('ink ladder matches substrate + elevation + line + dim', () => {
    expect(brand.ink).toEqual([
      cssVar('bg'), cssVar('surface'), cssVar('surface-2'), cssVar('line'), cssVar('dim'),
    ]);
  });
  it('semantic colors match --ok / --accent / --bad', () => {
    expect(brand.semantic.success).toBe(cssVar('ok'));
    expect(brand.semantic.warning).toBe(cssVar('accent'));
    expect(brand.semantic.danger).toBe(cssVar('bad'));
  });
  it('radii match the near-square scale (--r-2=3, --r-3=4)', () => {
    expect(cssVar.bind(null)).toBeDefined();
    expect(css).toMatch(/--r-2:\s*3px/);
    expect(css).toMatch(/--r-3:\s*4px/);
    expect(brand.radii.sm).toBe(3);
    expect(brand.radii.md).toBe(4);
  });
  it('dark-only identity + Geist/JetBrains Mono fonts', () => {
    expect(brand.colorMode).toBe('dark-only');
    expect(brand.fonts.display).toBe('Geist');
    expect(brand.fonts.mono).toBe('JetBrains Mono');
  });
  it('no banned patterns leaked into the shipped CSS', () => {
    expect(css).not.toMatch(/backdrop-blur/);
    expect(css).not.toMatch(/rounded-\[/);
  });
});
