# Codebase Structure

## Overview

The repository is organized so page routes remain at root, while all static assets are centralized in `assets/`.

## Directory Structure

```
html/
├── assets/
│   ├── css/                  # Stylesheets and vendor CSS
│   ├── js/                   # Application scripts, modules, third-party libraries
│   │   ├── modules/          # Shared systems (motion, reusable interactions)
│   │   └── pages/            # Route-specific behavior
│   ├── img/                  # Images and project-specific visual assets
│   ├── fonts/                # Font files
│   ├── video/                # Video assets
│   ├── favicons/             # Favicon and web manifest files
│   └── slide/                # Slide-specific assets
├── docs/
│   └── FILE_MANAGEMENT.md    # Operational file management rules
├── legacy/
│   └── unused-root/          # Archived root files retained for reference
├── php/                      # Mail endpoint
├── scss/                     # SCSS source files
├── scripts/
│   └── file-manager.sh       # Size/reference auditing utility
└── *.html                    # Page entry points (kept at root for stable URLs)
```

## Front-end Contracts

- `assets/css/lamalama-ui.css` owns the shared visual language and components.
- `assets/css/benchmark-system.css` owns shared layout composition.
- `assets/css/motion-system.css` owns timing, easing, reveal, and page-transition behavior.
- `assets/css/pitchdeck-overlay.css` and `assets/js/modules/pitchdeck-overlay.js` exclusively own the reusable full-screen resume lifecycle; `assets/js/pages/pitchdeck.js` exclusively owns navigation and motion inside the isolated deck.
- `assets/js/pages/lamalama-ui.js` owns shared shell controls, menu state, theme, and hero atmosphere; `assets/js/pages/home-ui.js` contains homepage-only section and video state.
- Continuous background motion must pause while a full-screen experience is active.
- Page-only styling stays in a named route stylesheet such as `contact-page.css`.
- Shared JavaScript belongs in `assets/js/modules/`; page controllers belong in `assets/js/pages/`.
- Keep inline JavaScript limited to the early theme bootstrap required to prevent a flash of the wrong theme.

## File Management Workflow

1. Keep new static assets under `assets/`.
2. Keep route files (`*.html`) at root unless routing is intentionally changed.
3. Archive superseded loose files in `legacy/unused-root/`.
4. Run link integrity checks after moves:

```bash
./scripts/file-manager.sh check-links
```

5. Use size report to manage bloat:

```bash
./scripts/file-manager.sh largest
```
