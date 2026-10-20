# Codebase Structure

## Overview

This is a static multi-page site. Production routes remain at the repository root so their public URLs stay stable; Vite has an explicit allowlist for the pages included in a production build.

```text
html/
├── assets/
│   ├── css/
│   │   ├── entries/           # Vite CSS entrypoints, one per page family
│   │   ├── *.css              # Shared systems and route styles
│   ├── favicons/
│   ├── fonts/
│   ├── img/
│   ├── js/
│   │   ├── modules/           # Shared behavior
│   │   ├── pages/             # Page-family behavior
│   │   └── libs/              # Third-party runtime libraries
│   ├── partials/              # Static HTML fragments
│   └── video/
├── docs/                      # Project and audit documentation
├── php/                       # Optional mail endpoint
├── scripts/                   # Build and maintenance commands
├── *.html                     # Public routes and local-only experiments
└── vite.config.mjs            # Production HTML entry allowlist
```

There is no `legacy/`, `scss/`, or `assets/slide/` directory in the current tree. Standalone experiments such as `bpm3.html`, `KICKSJOINT_Animated_Logo_Blinds.html`, and `kicksjoint-icons-animated-v6.html` remain available to the local dev server but are intentionally absent from the production entry allowlist.

## Front-end ownership

- `assets/css/entries/` defines the CSS dependency graph for each route family.
- `assets/css/lamalama-ui-site.css` is the shared site-shell stylesheet for home, work, case study, contact, and privacy pages.
- `assets/css/lamalama-ui.css` is the separate stylesheet baseline used by the pitch deck. These two files contain divergent rules and are not source/minified copies of one another; do not regenerate one from the other without a visual migration.
- `assets/css/design-tokens.css`, `design-tokens-standard.css`, `theme-system.css`, and `motion-system.css` own their named token, theme, and motion layers.
- `assets/js/site-entry.js` is the Vite runtime entry and dispatches to shared modules and page controllers based on page classes and data attributes.
- Shared JavaScript belongs in `assets/js/modules/`; page-family controllers belong in `assets/js/pages/`.
- `assets/js/pages/lamalama-ui.js` owns shared shell controls and menu state; `assets/js/pages/home-ui.js` owns home-only interactions.
- The pitch-deck overlay lifecycle is shared through `assets/css/pitchdeck-overlay.css` and `assets/js/modules/pitchdeck-overlay.js`; `assets/js/pages/pitchdeck.js` owns interactions inside the deck.
- Keep inline JavaScript limited to the early theme bootstrap required to prevent a flash of the wrong theme.

## Production build

`vite.config.mjs` is the source of truth for production HTML routes. `scripts/build-production.sh` builds into a clean output directory, then copies static media and the small set of direct-path runtime dependencies. It omits source HTML, CSS, and JavaScript from the published artifact, preventing duplicate pages and source files from keeping redundant media in the output. Exact duplicate images, video, and fonts are pruned after the build. The artifact has a 650 MiB ceiling.

Use the production pipeline to prepare the deployable artifact:

```bash
./scripts/production-check.sh
./scripts/build-production.sh _site
```

The default `npm run build` is a clean Vite build into `dist`; it does not copy the extra static files used by the production pipeline.

## File management

1. Keep new static assets under `assets/`.
2. Keep public route files at the repository root unless routing changes intentionally.
3. Add public pages to `vite.config.mjs`; keep local experiments out of its production allowlist.
4. Run `./scripts/file-manager.sh check-links` after moving files.
5. Use `./scripts/file-manager.sh largest` to inspect source asset weight.
