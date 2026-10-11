# DESIGN_SYSTEM.md — Quorum (heraldic "gules & azure on ink")

> Heraldic design system (DNA-HERALDIC-INK). Formalized by design-forge from the shipped
> `quorum/src/app/globals.css` — every value below is transcribed from code actually in use,
> authored in OKLCH, not invented. This is the durable contract downstream skills (build,
> stress, demo-video, deploy) consume. sRGB hex shown alongside OKLCH are faithful conversions
> for tooling that cannot parse OKLCH; the OKLCH value is canonical.

## Identity

- **World statement:** A heraldic court inside a trading terminal. Three AI advocates — Bull,
  Bear, Risk — argue a real catalyst; a Judge rules on the record; the losing argument is never
  erased. The look is "gules & azure on ink": crimson authority and azure dissent set against a
  dark ink-indigo chamber, Fraunces serif for the voice of the court, mono for the record.
- **Accent color:** `--accent` = `oklch(0.585 0.170 25)` (≈ `#cd4845`) — **Lac crimson, RESERVED
  to authority.** It is the Judge, the ruling, the conviction ring, and the single primary CTA —
  never spent as chrome or decoration. `--accent-hi` `oklch(0.690 0.180 28)` (≈ `#f76659`) is the
  hover/link brighten. This is the one saturated brand hue; every other saturated color is a
  *role signal*, never UI chrome: azure = dissent/Bear, gold (or) = Bull, vert = filled/affirmed,
  argent = Risk/held.
- **Named signature element:** the **Verdict Seal** — a radial debate instrument (viewBox
  200×200, center 100, rim R=72, ring R=84). Three advocate arcs at 20°/140°/260° converge on a
  central ruling core; a crimson conviction ring sweeps proportional to the panel's conviction
  against a visible threshold-bar notch; an azure dashed thread marks the preserved dissent.
  It animates its verb-loop in the hero (arcs draw → ring fills → core stamps → hold → loop) and
  shrinks to a 18–22px mark in the nav/footer reflecting the latest real decision.
- **Invariant phrase (EX-10):** **"Dissent is never erased."** Reused verbatim across the README,
  the landing hero, and this document.

## Tokens

### Color — substrate + elevation (bg-step, 0 neutral drops in flow)
| Token | OKLCH | ≈ sRGB | Role |
|-------|-------|--------|------|
| `--bg-base` | `oklch(0.168 0.014 274)` | `#0d0f15` | page substrate — chamber ink-indigo |
| `--s1` / `--surface` | `oklch(0.205 0.016 274)` | `#15171f` | elevation 1 — cards |
| `--s2` | `oklch(0.238 0.017 274)` | `#1c1e27` | elevation 2 — card hover, sub-cards |
| `--s3` | `oklch(0.278 0.018 274)` | `#252831` | elevation 3 — insets, raised chips |

### Color — ink (parchment ladder)
| Token | OKLCH | ≈ sRGB | Role |
|-------|-------|--------|------|
| `--ink` | `oklch(0.936 0.013 86)` | `#eceae3` | primary text |
| `--ink-dim` | `oklch(0.715 0.012 80)` | `#a7a29b` | secondary text, labels (WCAG-AA) |
| `--ink-faint` | `oklch(0.545 0.012 76)` | `#7d7971` | tertiary / captions |

### Color — accent (authority) + role signals (verdict/role ONLY)
| Token | OKLCH | ≈ sRGB | Role |
|-------|-------|--------|------|
| `--accent` | `oklch(0.585 0.170 25)` | `#cd4845` | Lac crimson — Judge / ruling / conviction ring / CTA |
| `--accent-hi` | `oklch(0.690 0.180 28)` | `#f76659` | hover / link brighten |
| `--accent-ink` | `oklch(0.972 0.012 70)` | `#fdf4ef` | text on crimson fills |
| `--azure` | `oklch(0.705 0.105 242)` | `#60a8dc` | dissent / Bear / counsel |
| `--vert` | `oklch(0.740 0.120 158)` | `#61c28e` | settled / affirmed / FILLED |
| `--or` | `oklch(0.780 0.130 75)` | `#e8aa4e` | advisory / Bull / pending-near-bar |
| `--argent` | `= --ink-dim` | `#a7a29b` | Risk / NO_TRADE held |

### Alpha-over-role ladder (color-mix in oklab — surface variety, not new hues)
`--ink-04/06/08/10/14/20` (ink mixed into transparent) drive borders, hover fills, hairlines.
`--acc-10/16/24/40`, `--azure-14/24`, `--vert-14/24`, `--or-14/24` back the verdict chips.
Semantic: `--border` = `--ink-08`, `--border-strong` = `--ink-14`, `--hover-fill` = `--ink-06`,
`--focus-ring` = `--accent-hi` (dark) / `--accent` (light).

### Type scale (fluid clamp)
- Fonts: `--f-display` = **Fraunces** (opsz serif — headings, the voice of the court);
  `--f-body` = **Inter**; `--f-mono` = **JetBrains Mono** (numbers, tickers, verdicts, hashes).
- `--t-display` `clamp(2.6rem, 1.5rem + 4.6vw, 5.2rem)` — hero, weight 900, lh 0.98, ls −0.03em
- `--t-h1` `clamp(1.9rem, 1.3rem + 2.4vw, 3.1rem)`
- `--t-h2` `clamp(1.35rem, 1.05rem + 1.2vw, 1.85rem)`
- `--t-stat` `clamp(2.1rem, 1.4rem + 2.6vw, 3.6rem)` — big metrics
- `--t-body` `1rem` (lh 1.6) · `--t-small` `0.8125rem` · `--t-eyebrow` `0.6875rem`
- `.eyebrow` = mono, uppercase, ls 0.24em, color `--accent-hi`. `.mono` sets tabular+lining nums.

### Spacing scale (base 4px)
`--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 24 · `--s-6` 32 · `--s-7` 48 · `--s-8` 64 · `--s-9` 96 · `--s-10` 128

### Border-radius scale (tokenized — no ad-hoc values)
`--r-sm` 6px · `--r-md` 10px · `--r-lg` 16px (cards) · `--r-xl` 22px · `--r-full` 999px (chips, buttons, nav pills)

### Shadow scale — `pure-glow` (named, one philosophy)
Drops are OVERLAY-ONLY; in-flow depth is carried by bg-step + hairline, never neutral drop shadows.
- `--overlay-shadow` `0 12px 34px rgba(0,0,0,.55), 0 2px 8px rgba(0,0,0,.45)` (transient overlays only)
- `--glow-ruling` `0 0 0 1px var(--acc-40), 0 22px 90px -24px var(--acc-40)` — the crimson authority glow
- The Verdict Seal ring carries `drop-shadow(0 0 6px var(--acc-40))` and shimmers on the hero.

### Ready-to-paste `@theme` block (dark default + light overrides)
```css
@theme {
  /* dark — the chamber (default identity) */
  --color-bg-base: oklch(0.168 0.014 274);
  --color-s1: oklch(0.205 0.016 274);
  --color-s2: oklch(0.238 0.017 274);
  --color-s3: oklch(0.278 0.018 274);
  --color-ink: oklch(0.936 0.013 86);
  --color-ink-dim: oklch(0.715 0.012 80);
  --color-ink-faint: oklch(0.545 0.012 76);
  --color-accent: oklch(0.585 0.170 25);      /* Lac crimson — authority */
  --color-accent-hi: oklch(0.690 0.180 28);
  --color-azure: oklch(0.705 0.105 242);       /* dissent / Bear */
  --color-vert: oklch(0.740 0.120 158);        /* filled / affirmed */
  --color-or: oklch(0.780 0.130 75);           /* Bull / advisory */

  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px; --radius-xl: 22px; --radius-full: 999px;

  --shadow-overlay: 0 12px 34px rgba(0,0,0,.55), 0 2px 8px rgba(0,0,0,.45);
  --shadow-glow-ruling: 0 0 0 1px color-mix(in oklab, var(--color-accent) 40%, transparent),
                        0 22px 90px -24px color-mix(in oklab, var(--color-accent) 40%, transparent);
}
/* light — "daylight hearing / parchment" (overrides only) */
[data-theme="light"] {
  --color-bg-base: oklch(0.955 0.010 86);
  --color-s1: oklch(0.925 0.012 84); --color-s2: oklch(0.895 0.013 82); --color-s3: oklch(0.860 0.015 80);
  --color-ink: oklch(0.255 0.020 278); --color-ink-dim: oklch(0.440 0.018 276); --color-ink-faint: oklch(0.580 0.016 274);
  --color-accent: oklch(0.520 0.175 25); --color-accent-hi: oklch(0.470 0.185 26);
  --color-azure: oklch(0.520 0.130 245); --color-vert: oklch(0.560 0.130 160); --color-or: oklch(0.620 0.135 68);
}
```

### Do's / Don'ts
- **Do** reserve crimson (`--accent`) to authority — the ruling, the conviction ring, the one
  primary CTA. Role signals (azure/or/vert/argent) encode verdict/advocate state, never chrome.
- **Do** build surface variety from the bg-step ladder (`--s1..--s3`) + the alpha-over-role
  ladder (`--ink-0x`, `--acc-xx`) — never a second brand hue.
- **Do** set `font-variant-numeric: tabular-nums` on every metric; mono carries all numbers.
- **Don't** add neutral drop shadows in flow (lift with bg-step + hairline); drops are overlay-only.
- **Don't** introduce ad-hoc radii (`rounded-[17px]`) or inline hex — reference tokens only.
- **Don't** add backdrop-blur to the nav (it is intentionally solid + hairline).

## Status Legend

Color carries meaning, never decoration. Verdict chips encode **hue + shape** (a `::before`
glyph) so the state reads without color alone:

| Color | Glyph | State token | Meaning |
|-------|-------|-------------|---------|
| `--accent` crimson | filled dot / stamp | `TRADE` / `RULING` / `REJECT` | the Judge's ruling on the record (authority) |
| `--azure` | left-triangle / dashed thread | `DISSENT` / `BEAR` | preserved minority opinion; Bear advocate |
| `--or` gold | up-triangle | `BULL` / `ADVISORY (SPOT_LONG_ONLY)` | Bull advocate; honest short signal, no fabricated fill |
| `--argent` (ink-dim) | diamond / hollow ring | `RISK` / `NO_TRADE` | Risk advocate; below-bar ruling, size 0 |
| `--vert` | filled dot | `FILLED` / `settled` | real paper order filled on Agent Hub; affirmed |

## Craft

- **Radius scale (CF-1):** `--r-sm` 6 · `--r-md` 10 · `--r-lg` 16 · `--r-xl` 22 · `--r-full` 999.
  Cards use `--r-lg`; chips/buttons/nav-pills use `--r-full`. Zero inline `rounded-[Npx]`.
- **Elevation ladder (CF-2):** `--bg-base` → `--s1` → `--s2` → `--s3`. Surfaces get *lighter*
  per z-level in dark mode. A card is `--s1`; its hover is `--s2`; an inset is `--s3`.
- **Shadow philosophy — `pure-glow` (named, one only):** in-flow depth = bg-step + hairline.
  The only shadows are `--overlay-shadow` (transient overlays) and `--glow-ruling` (the crimson
  authority glow on the ruling + seal ring). No pixel-offset, no soft neutral card shadows.
- **Glass recipe:** NONE on the nav (solid `--bg-base` + 1px `--border`, no backdrop-filter —
  intentional). The only "atmosphere" is the `.field` layer (see below), not glass.
- **Hover recipe:** `.card` → `border-color: --border-strong` + `background: --s2` (no scale).
  `.btn-primary` → `background: --accent-hi`. `.btn-ghost` / `.nav-links a` → `background:
  --hover-fill` + border steps to `--ink-20`. Transitions `--t-base` (.24s) / `--t-fast` (.12s).
  `.btn:active` → `translateY(1px)`.
- **Focus-visible recipe:** `outline: 2px solid var(--focus-ring); outline-offset: 2px;` on
  `.btn`, `a`, `[tabindex]` — one recipe everywhere (crimson ring).
- **Background atmosphere — the "docket chamber" field (`.field`):** a constructed, graded
  backdrop, NOT a decorative gradient: a baked tonal arc (warm crimson `--ember` chamber-light
  top-left → ink → cool azure `--haze` right), two drifting screen-blend glows (`.glow-a`/`.glow-b`),
  faint concentric engrave-rings (`.engrave`), overlay grain (`.grain`), and animated argument
  filaments (`.filaments` — warm/cool curves streaming toward the conviction node). `--ember`
  and `--haze` are atmosphere-only, never text/UI.
- **Named signature element + where it stays visible:** the Verdict Seal — animated in the
  landing hero, and as an 18–22px live mini-seal in the nav brand + footer (reflecting the latest
  real decision), on every page.

## Primitives

| Primitive | Class | Spec |
|-----------|-------|------|
| Nav | `.nav` / `.nav-inner` | sticky, solid `--bg-base`, 1px `--border` bottom, 60px, NO backdrop-blur |
| Brand mark | `.brand` | Fraunces 1.05rem + live `<VerdictSeal size={22}>` |
| Button (primary) | `.btn.btn-primary` | `--accent` bg, `--accent-ink` text, `--r-full`, hover → `--accent-hi` |
| Button (ghost) | `.btn.btn-ghost` | transparent, `--border-strong`, hover → `--hover-fill` |
| Card | `.card` | `--s1` bg, 1px `--border`, `--r-lg`, `--s-5` pad, hover → `--s2` + `--border-strong` |
| Chip | `.chip` | mono 12px, 1px `--border-strong`, `--r-full` |
| Verdict chip | `.v` + `.v-trade/-notrade/-short/-filled/-reject` | hue + `::before` shape glyph |
| Advocate dot | `.r-bull/-bear/-risk` | gold ▲ / azure ◀ / argent ◆ |
| Docket table | `.docket` | mono, tabular-nums, uppercase mono `th`, hairline row rules, row hover |
| Verdict Seal | `<VerdictSeal>` | SVG 200×200 — arcs + conviction ring + core + dissent thread |
| Reveal | `[data-reveal]` | resting visible; `.js` fades/slides in on scroll; reduced-motion shows all |

### Hero surface 1 — landing (the radial debate)
The animated **Verdict Seal** over the `.field` docket-chamber atmosphere: three advocate arcs
draw in, the crimson conviction ring fills to the conviction value against the threshold notch,
the ruling core stamps, holds, loops. Eyebrow (mono) + Fraunces display headline + lede. The
seal reflects the latest *real* decision — no fabricated hero. This is the cold-stranger money shot.

### Hero surface 2 — console / proof (`/app`, `/backtest`, `/proof`)
Reading-room density, not a marketing hero: `.docket` metric tables (hairline-bordered,
tabular-nums mono), verdict chips carrying hue+shape, the OOS equity panel where `--vert` (Panel)
beats `--ink-dim` (ablation). Honest dashed empty states when evidence is absent.

## Overlay Layer Policy

The bg-step ladder (`--s1..--s3`) covers nested reading surfaces. Transient overlays (dialogs,
menus, toasts) do NOT introduce a new in-flow elevation: they use `--s2`/`--s3` + `--overlay-shadow`
over a dimmed backdrop. This keeps the chamber's flat, hairline character intact.

## Source of Truth (formalization provenance)

Every value here is transcribed from `quorum/src/app/globals.css` (shipped, re-skinned to the
heraldic system and contrast-fixed), cross-read against the reference
`REFERENCE-TEARDOWN/RUN-quorum/render/tokens.css`. Fonts verified against `quorum/src/app/layout.tsx`
(Google Fonts: Fraunces + Inter + JetBrains Mono). No value is invented. This is a *formalization*
of the shipped, Dami-LOCKED heraldic UI — not a redesign. Honesty posture is unchanged: advisory /
SPOT_LONG_ONLY, directional-signal, no overclaim.

## Motion

- Easing vocabulary: `--ease-out-cubic` `(.33,1,.68,1)`, `--ease-out-expo` `(.16,1,.30,1)`,
  `--ease-spring` `(.34,1.26,.64,1)`. Durations `--t-fast` .12s · `--t-base` .24s · `--t-mid` .4s ·
  `--t-slow` .7s · `--t-draw` 1.5s.
- Verdict Seal verb-loop: arcs draw (staggered 220ms), ring fills (1.3s expo), core stamps
  (.4s spring), ~6.2s loop. Field: glow drift (22/26s), engrave breathe (11s), ring shimmer (4.5s).
- `[data-reveal]` fade+slide on scroll (`--t-slow` cubic); `.btn:active` → `translateY(1px)`.
- Scroll conviction indicator (`.scroll-ind`): a 2px crimson rim scaled to scroll progress.
- `@media (prefers-reduced-motion: reduce)`: all animations/transitions collapse to ~0ms,
  `[data-reveal]` forced visible, glows stop — honored globally.
- Mobile ≤640px: grids collapse to one column; `.docket` scrolls; `overflow-x: hidden` on body.
