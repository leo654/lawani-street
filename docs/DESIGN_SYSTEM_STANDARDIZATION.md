# Design system conventions

## Token ownership

- `assets/css/design-tokens.css` owns brand primitives and the established `--ll-*` compatibility variables used by existing site styles.
- `assets/css/design-tokens-standard.css` owns semantic tokens such as `--color-*`, `--font-size-*`, `--space-*`, and `--duration-*`. Its values map back to the foundation where a matching primitive exists.
- `assets/css/theme-system.css` owns theme-dependent values. Semantic colors that should follow the active theme should refer to theme-aware `--ll-*` values rather than fixed hex values.
- `assets/css/motion-system.css` owns shared motion behavior and aliases its timings to the token layer.
- `assets/css/button-system.css` owns shared button and filter-control presentation. It is loaded by the home, work, case-study, and contact entry stylesheets.
- `assets/css/design-tokens-standard.css` owns the shared button size and width scales; components select the appropriate tier instead of adding isolated pixel values.

Keep legacy aliases in `design-tokens.css`; do not redefine them in the semantic layer. This avoids import order changing the meaning of existing components.

## Stylesheet order

Each primary route entry stylesheet should load:

1. `design-tokens.css`
2. `design-tokens-standard.css`
3. The route's base styles
4. Shared component styles, including `button-system.css`
5. Route-specific refinements and theme overrides

Later imports are allowed to specialize a component for a route or theme. Avoid loading the same file twice in one entry stylesheet.

## Usage

- Use semantic tokens for new styles: `var(--color-text-primary)`, `var(--space-md)`, `var(--font-size-base)`, `var(--duration-fast)`, and `var(--radius-control)`.
- Use the established `--ll-*` aliases when editing legacy site styles; migrate those styles in focused groups so each change remains reviewable.
- Use the button hierarchy for interactive controls: compact is 12px text on a 44px minimum target, default is 14px text at 50px, and prominent is 16px text at 56px. All heights respect `--min-touch-target`.
- Use `--button-width-content` for content-sized controls and `--button-width-full` for controls that fill their parent. The home résumé/contact pair uses `--button-width-home-pair` so both actions stay matched, with a responsive override on small screens.
- Apply `.ll-button--compact`, `.ll-button--large`, `.ll-button--full`, or `.ll-button--fit` when a button needs a named size or width behavior. Project case actions use the compact label tier while retaining the touch target.
- Keep keyboard focus visible with `:focus-visible`; hover styling should not be the only interaction cue.
- Respect `prefers-reduced-motion` in shared and route-specific animation rules.
- Preserve clear fallbacks when using newer CSS features, such as `color-mix()`.

## Current scope

The token foundation and shared button system are standardized for the primary site routes. Legacy page styles and third-party stylesheets still contain fixed values and should be migrated incrementally when those components are updated. Avoid claiming global token coverage until those files have been audited and migrated.

## Update 2026-11-02

### Fixed brand colour tokens
`--ll-white` and `--ll-black` are **theme-aware**: the light theme (`theme-system.css`, `lamalama-ui*.css`) inverts them. Do not use them for "this must always be cream/black". For fixed brand values use:

- `--ll-brand-cream` (`#f4f2ec`), `--ll-brand-black` (`#070807`), `--ll-brand-orange` (`#ff4f12`)
- RGB triplets for alpha: `rgba(var(--ll-brand-cream-rgb), 0.58)`, `--ll-brand-black-rgb`, `--ll-brand-orange-rgb`

About 470 repeated literals in the loaded stylesheets now use these. Literals still intentionally remain in the token files, `theme-system.css`, and inside `url(...)` data URIs (where `var()` is not allowed).

### Stacking layers
High, cross-component layers use named tokens (values unchanged): `--ll-z-skip-link` (1000), `--ll-z-overlay` (2147482000), `--ll-z-overlay-high` (2147483000), `--ll-z-transition` (2147483646), `--ll-z-top` (2147483647). Small local values (0-120) stay as plain numbers. The `--z-*` scale in `design-tokens-standard.css` is unused and does not match the site's real values; do not adopt it without migrating.

### Breakpoints (CSS cannot use variables in media queries, so these are conventions)
Use this scale for new work: **560** (small phone), **768** (tablet portrait), **992** (tablet landscape / small desktop), **1200** (desktop). Paired queries should be complements (`max-width: 767px` with `min-width: 768px`).
Legacy values still in the loaded stylesheets, mostly in `mobile-hotfix.css`, `lamalama-ui*.css` and `index-polish.css`: 560, 720, 760/761, 820/821, 900, 980/981, 1000, 1024/1025, 1100. Consolidate these only with a visual check at each width, because moving a boundary shifts layouts.

### Unused CSS
Stylesheets not reachable from any page (`main.min.css`, `custom.css`, `bootstrap-grid.min.css`, `work-experience.css`, `estrela-menu.css`, and others) were moved to `tmp/dead-css-2026-11-02/`. They never shipped in the production build; removing them only declutters the source.

### `!important`
About 1,059 declarations in the loaded stylesheets; per-file counts are in `docs/css-important-inventory-2026-11-02.csv`. `mobile-hotfix.css` holds about 376. Some are needed to beat inline styles that GSAP writes, so remove them one component at a time with a visual check.

### Section spacing (standard rhythm)
- **Major sections** (home services, manifesto; case-study gallery end): `--ll-section-space` (89-144px).
- **Minor / lead-in sections** (about, work intro, footers, related work): `--ll-section-space-compact` (55-89px).
- **Hero top / bottom** (case-study and work heroes): `--ll-hero-top` (112-160px) and `--ll-hero-bottom` (34px).
- **Side gutters:** `--ll-page-gutter` (`--ll-gutter` is an alias).
- Dark sections that start with the stepped stripe edge add the stripe height on top (see `services-skill-sets.css`).
Use these tokens for new sections; do not add per-page pixel values.
