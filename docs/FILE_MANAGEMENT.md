# File Management Guide

## Current Layout

- `assets/`: all runtime static assets
- `assets/css/`: stylesheets and third-party CSS
- `assets/js/`: project scripts, modules, third-party libs
- `assets/img/`: images and per-project artwork
- `assets/fonts/`: webfonts
- `assets/video/`: video assets
- `assets/favicons/`: favicon/webmanifest files
- `assets/slide/`: slide-specific assets
- `legacy/unused-root/`: archived root files not used by current pages
- `scripts/file-manager.sh`: repository health and reference checks
- `scss/`: source SCSS for stylesheet maintenance
- `php/`: backend mail endpoint

## Management Commands

Run from the repository root:

```bash
./scripts/file-manager.sh status
./scripts/file-manager.sh largest
./scripts/file-manager.sh check-links
./scripts/file-manager.sh check-links all
```

- `check-links` (default `assets` mode): checks only static asset references.
- `check-links all`: also checks local page links (`.html`, `.php`).

## Conventions

- Keep page entry files (`*.html`) at project root.
- Put all new static files inside `assets/` by type.
- Do not add new loose root-level JS/CSS files.
- Archive superseded files in `legacy/unused-root/` instead of deleting immediately.
- Run `./scripts/file-manager.sh check-links` after path or file moves.
