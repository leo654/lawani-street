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
