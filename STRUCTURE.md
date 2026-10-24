# Codebase structure

This is a static multi-page site. Public routes live at the repository root and the production HTML allowlist is maintained in `vite.config.mjs`.

```text
html/
├── assets/
│   ├── css/
│   │   ├── components/       # Component appearance, states, and motion
│   │   └── entries/          # Route-family CSS compositions
│   ├── js/
│   │   ├── components/       # Component interactions
│   │   ├── modules/          # Shared behavior
│   │   ├── pages/            # Page-family behavior
│   │   └── libs/             # Runtime libraries
│   ├── media/                # Source media and fonts
│   └── ...                   # Other shared assets
├── docs/                     # Architecture and audit notes
├── *.html                    # Public routes and standalone experiments
├── vite.config.mjs           # Production route allowlist
└── package.json              # Dev and production build commands
```

Generated CSS, JavaScript, and media are emitted under `dist/assets/build/` or `_site/assets/build/`. The source tree does not contain a generated `assets/build/` directory.

For route ownership, component conventions, and build workflow, see [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md).
