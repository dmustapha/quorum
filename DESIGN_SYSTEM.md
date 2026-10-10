# DESIGN_SYSTEM.md — Quorum (Voir Dire)

> Terminal-ledger design system (DNA-TERMINAL-LEDGER-B). Formalized by design-forge from
> the shipped `src/app/globals.css` — every value below is transcribed from code actually
> in use, not invented. This is the durable contract downstream skills (build, stress,
> demo-video, deploy) consume.

## Identity

- **World statement:** A courtroom inside a trading terminal. Three AI counsel (Bull, Bear, Risk)
  argue a real earnings catalyst; a Judge rules on the record; the losing argument is never
  erased — every verdict ships with its preserved dissent and the evidence to recompute it.
- **Accent color:** `#b6ff3c` electric lime — the scalpel, not the floodlight. Its three
  load-bearing *narrative* moments are the ruling-card border, the preserved-minority panel,
  and "Panel beats ablation" in the OOS proof. As shipped it is also the single UI accent
  (links, focus ring, button fill, hover border, the 3%-opacity background vignette). The
  restraint is *saturation discipline*, not literal use-count: lime is the only saturated
  non-semantic hue, and it never competes with itself on a surface. Signal green `#00e08a`
  is the secondary live/go hue; restrained red `#ff4d4d` is Bear/SHORT/loss.
- **Named signature element:** the **ruling-on-tape card** — a verdict wearing a terminal
  window's `● ● ●` dot-header, lime-hairline bordered, with a **lime-topped preserved-minority
  panel** welded below the ruling. Dissent is architecturally first-class, not a footnote.
- **Invariant phrase (EX-10):** **"Dissent is never erased."** Reused verbatim across the README,
  the landing hero, and this document.

## Tokens

### Color — substrate + 2-level elevation
| Token | Value | Role |
|-------|-------|------|
| `--bg` | `#0b0d10` | page substrate (deep near-black) |
| `--surface` / `--surface-1` | `#16181d` | elevation level 1 — cards |
| `--surface-2` | `#1c1f26` | elevation level 2 — sub-cards, insets, inputs |
| `--line` / `--ring` | `#262a31` | hairline borders + focus ring base |

### Color — ink
| Token | Value | Role |
|-------|-------|------|
| `--fg` | `#e7eaee` | primary text (16:1 on bg) |
| `--fg-dim` | `#8a929e` | secondary text |
| `--dim` | `#767d89` | labels, captions, tertiary (AA ~4.5:1 on --bg) |

### Color — accents (semantic, never decorative)
| Token | Value | Role |
|-------|-------|------|
| `--accent` / `--lime` | `#b6ff3c` | the scalpel — ruling border, dissent, panel-beats |
| `--dissent` | `#b6ff3c` | minority opinion is first-class, lime-highlighted |
| `--ok` / `--green` | `#00e08a` | live / long / BUY / filled order |
| `--bad` / `--red` | `#ff4d4d` | short / loss / SELL / rejected |

### Type scale
- Fonts: `--grot` = Geist (geometric grotesk, UI + headings); `--mono` = JetBrains Mono
  (numbers, tickers, verdicts, audit hashes — carries the "on the record / recomputable" feel).
- `h1`: `clamp(28px, 4vw, 40px)`, line-height 1.1, weight 600, letter-spacing −0.02em
- `tape-act` (ruling verb): `clamp(26px, 6vw, 36px)`, weight 700
- `h2`: 13px, uppercase, letter-spacing 0.12em, weight 500, color `--dim`
- `h3`: 11px, uppercase, letter-spacing 0.12em, weight 500, color `--dim`
- body: 15px, line-height 1.55
- mono data (`.kv .v`): 17px, `font-variant-numeric: tabular-nums`
- mono labels / badges / rows: 10–13px, letter-spacing 0.04–0.16em, often uppercase

### Spacing scale (base 4px)
`--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 24 · `--s-6` 32 · `--s-7` 48

### Border-radius scale (near-square — this is a terminal, not a toy)
`--r-2` 3px (buttons, badges, sub-cards, inputs) · `--r-3` 4px (cards, panels, hero)

### Shadow scale
- `--shadow-1` `0 1px 2px rgba(0,0,0,0.4)` — resting hairline lift
- `--shadow-2` `0 8px 28px rgba(0,0,0,0.45)` — elevated/overlay

### Ready-to-paste `@theme` block (dark-only — dark IS the identity)
```css
@theme {
  --color-bg: #0b0d10;
  --color-surface: #16181d;
  --color-surface-2: #1c1f26;
  --color-line: #262a31;
  --color-fg: #e7eaee;
  --color-fg-dim: #8a929e;
  --color-dim: #767d89;
  --color-accent: #b6ff3c;   /* lime — the scalpel */
  --color-ok: #00e08a;       /* green — live/long */
  --color-bad: #ff4d4d;      /* red — short/loss */

  --font-grot: 'Geist', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;

  --radius-sm: 3px;  /* --r-2 */
  --radius-md: 4px;  /* --r-3 */

  --shadow-1: 0 1px 2px rgba(0,0,0,0.4);
  --shadow-2: 0 8px 28px rgba(0,0,0,0.45);
}
```

### Do's / Don'ts
- **Do** use exactly one accent hue (lime); surface variety comes from the two elevation
  levels + opacity (e.g. `rgba(182,255,60,0.035)` for the dissent wash), never a second hue.
- **Do** set `font-variant-numeric: tabular-nums` on every number/metric; mono carries all
  tickers, verdicts, sizes, and hashes.
- **Do** keep borders hairline (1px `--line`); lift with elevation (surface step), not shadow spam.
- **Don't** introduce ad-hoc radii (`rounded-[17px]`) or inline hex — reference tokens only.
- **Don't** add glassmorphism, decorative gradients, neon-everything, web3-toy pills, emoji UI,
  or AI-glow purple (rejection list — Dami-LOCKED).

## Status Legend

Color carries meaning, never decoration. Mapped to the real state tokens from
`decision-card.tsx` and the backtest verdict:

| Color | State token | Meaning |
|-------|-------------|---------|
| `#00e08a` green | `FILLED` / `BUY` / `LONG` | real paper order filled on Agent Hub, or long/go ruling |
| `#ff4d4d` red | `REJECTED` / `SELL` / `SHORT` | order rejected by venue, or bearish ruling / loss |
| `#b6ff3c` lime | `ADVISORY (SPOT_LONG_ONLY)` / `DISSENT` / `PANEL_BEATS_OOS` | honest short signal, no fabricated fill; preserved minority; panel beats OOS ablation |
| `#8a929e` dim | `NO_TRADE` / `skipped` | below conviction bar — size 0, no order |

## Craft

- **Radius scale (CF-1):** only `--r-2` (3px) and `--r-3` (4px). Zero inline `rounded-[Npx]`;
  grep of `src/` confirms no ad-hoc radii or inline hex in components.
- **Elevation ladder (CF-2):** `--bg` #0b0d10 → `--surface` #16181d → `--surface-2` #1c1f26.
  Surfaces get lighter per z-level (dark mode). Two levels only — a sub-card on a card uses
  `--surface-2`; the page uses `--bg`.
- **Shadow philosophy — `soft-elevation` (named, one only):** `--shadow-1` for resting lift,
  `--shadow-2` for overlays. In practice elevation is carried mostly by surface-step +
  hairline border; shadows are reserve. No pixel-offset, no pure-glow.
- **Glass recipe:** NONE — glassmorphism is on the rejection list. No `backdrop-blur` anywhere.
- **Hover recipe:** color/border shift, not scale. `.btn` → `filter: brightness(1.08)`;
  `.btn-ghost` / `.row-link` → background steps up one surface + border turns to `--accent`
  (or a 2px lime left-border on `.row-link`). Transitions 120–140ms ease. `:active` on `.btn`
  = `translateY(1px)`.
- **Focus-visible recipe:** `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`
  — consistent everywhere, lime ring.
- **Background atmosphere:** one single fixed radial vignette
  `radial-gradient(1200px 600px at 50% -5%, rgba(182,255,60,0.03), transparent 60%)` — a quiet
  terminal substrate, NOT a decorative gradient (3% lime, one stop).
- **Named signature element + where it stays visible:** the ruling-on-tape card (`.tape`) with
  its `● ● ●` dot-header (`.tape::before`) and the lime-topped `.min` dissent panel — visible on
  the landing hero and on every `/app/decision/[id]`.

## Primitives

| Primitive | Class | Spec |
|-----------|-------|------|
| Card | `.card` | `--surface` bg, 1px `--line`, `--r-3`, `--s-5` pad |
| Sub-card | `.card--sub` | `--surface-2` bg, 1px `--line`, `--r-2`, `--s-4` pad |
| Button (primary) | `.btn` | lime bg, `--bg` text, mono uppercase 13px, `--r-2`, brightness hover |
| Button (ghost) | `.btn-ghost` | full-width, `--surface-2`, border→lime on hover |
| Badge | `.badge` | mono 11px, 1px `--line`, `--surface-2`, `--r-2` — crisp, not a pill |
| Metrics table | `table.metrics` | mono, tabular-nums, right-aligned, hairline row rules |
| Counsel argument | `.arg` + `.arg--bull/--bear/--risk` | 2px left-border in green/red/lime |
| Decision row | `.row-link` | stacked mono list, lime left-border on hover |
| Topline | `.topline` | mono price-context strip, tabular-nums |
| Chart panel | `.panel` / `.panel-h` | hairline panel + uppercase mono header |
| Empty state | `.empty` | dashed `--line` border — honest "pending" surfaces |

### Hero surface 1 — Judge decision card (`.tape`)
Ruling-on-tape: lime-hairline border + `● ● ●` dot-header. Header = `Judge ruling · SYMBOL` +
large action verb (`.tape-act.buy/.long` green, `.sell/.short` red, `.no_trade` dim). `.kv`
strip = conviction / size / stop in mono tabular-nums. `.tape-rationale` prose. **`.min`
preserved-minority panel** = 2px lime top-border + 3.5% lime wash, lime uppercase label — the
differentiator, always rendered, never empty (INVARIANT 4). `.advis` order-status strip
(ok/dissent/dim/bad). `.tape-f` footer = append-only note + `evidenceHash`.

### Hero surface 2 — OOS proof panel (`/backtest`)
`.topline` config strip (OOS cutoff / horizon / bar) with the verdict right-aligned
(`.lime` when `PANEL_BEATS_OOS`, else `.bad`). `.panel` with IS/OOS `table.metrics` (panel +
ablation arms). Equity-curve `.panel`: lime polyline (Panel) over dim polyline (ablation) —
lime beating dim IS the proof. Honest `.empty` "Backtest pending" state when evidence absent.

## Overlay Layer Policy

The two-level elevation ladder covers nested reading surfaces (card → sub-card). Transient
overlays (dialogs, menus, popovers, toasts) do NOT introduce a third visual elevation: they
reuse `--surface-2` + `--shadow-2` over a dimmed backdrop. This keeps the terminal's flat,
hairline character intact. (Documented per peer-review diff-5; no shipped surface changes.)

## Token → Component Matrix (semantic colors)

Color is bound to state tokens in code, not applied decoratively:

| Token | Bound to | Code site |
|-------|----------|-----------|
| `--green` / `.ok` | `orderResult.status === 'filled'`; `.tape-act.buy/.long`; `PANEL_BEATS_OOS` curve | `decision-card.tsx`, `backtest/page.tsx` |
| `--red` / `.bad` | `orderResult.status === 'rejected'`; `.tape-act.sell/.short`; non-beat verdict | `decision-card.tsx`, `backtest/page.tsx` |
| `--lime` / `.dissent` | `orderResult.status === 'advisory'`; `.min` minority panel; `.panel-h .vb` verdict | `decision-card.tsx`, `backtest/page.tsx` |
| `--fg-dim` / `.dim` | `orderResult.status === 'skipped'` (NO_TRADE) | `decision-card.tsx` |

## Source of Truth (formalization provenance)

Every value in this document was transcribed from `src/app/globals.css` (shipped, QA-APPROVED
2026-10-10), verified by `design-tests/tokens.design.test.ts` (6/6 pass). Fonts verified against
`src/app/layout.tsx` (`next/font/google`: Geist + JetBrains_Mono). No value here is invented;
undocumented values may not enter this contract. This is a *formalization* of a Dami-LOCKED UI —
not a redesign. Two a11y-correctness defects found in peer + persona review were fixed in place
without altering the visual look: `--dim` raised #5a616c→#767d89 (WCAG-AA on small labels) and a
contrasting `.btn:focus-visible` ring (the lime-on-lime invisible-focus case). Aesthetic-direction
suggestions that WOULD change the locked look (splitting lime into separate hues, retiring the
`● ● ●` dot-header, a multi-series data-viz palette) are recorded as a Dami-decision downstream
item in PULSE, NOT silently changed here.

## Motion

- Default transition: 120–140ms ease, on `filter` / `background` / `border-color` / `transform`.
- `.btn:active` → `translateY(1px)` (press feedback). No page-load stagger, no entrance
  animation vocabulary — restraint over flourish (Linear/Vercel bar).
- `@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }` — honored globally.
- Mobile ≤640px: `.kv` and grids collapse to one column; `table.metrics` scrolls; no overflow-x.
