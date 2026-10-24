# Lawanistreet

## Project Layout

- Public route pages stay at repository root (`*.html`). `vite.config.mjs` explicitly lists production routes; other standalone experiments remain available in local development but are excluded from production.
- Static files live under `assets/` (`css`, `js`, `img`, `fonts`, `video`, `favicons`, and `partials`).
- Three standalone animation pages stay at the root and are included in the production build because case studies embed them in iframes. The unused design-system prototype is kept in `docs/legacy-design-system-experiment.css` for reference.
- Shared behavior lives in `assets/js/modules/`; route-specific behavior lives in `assets/js/pages/`.
- Shared motion timing and page transitions are defined by `motion-system.css` and `motion-system.js`.
- Resume links use one preloaded full-screen fade in `pitchdeck-overlay.css` / `pitchdeck-overlay.js`; the isolated `pitchdeck.html` controller owns only slide navigation and remains directly accessible.
- Full-screen overlays suspend background video and halftone rendering, then restore only media that was previously playing.

## Available commands

This source copy has no `scripts/` maintenance or production-validation utilities. Its available package commands are:

```bash
npm ci
npm run dev
npm run build
```

Vite serves the local preview and builds the listed HTML routes into `dist/` by default. The earlier documentation referenced shell scripts and an ignore list that are not present in this copy; do not rely on those commands until the files are restored. The published site is `https://leo654.github.io/lawani-street/`.

The Pages artifact has a 650 MiB size ceiling. Where a visually equivalent WebP delivery image exists, page references use it to reduce transfer size; social preview metadata keeps crawler-compatible PNG/JPG images. Large project videos use 720p H.264 MP4 delivery variants.

## Local Preview

On macOS, double-click `Open Website.command` to start the local server and open the site in your browser. Keep the Terminal window open while browsing; close it to stop the server. If dependencies are not installed, run `npm ci` in Terminal in this folder first.

Opening an individual HTML file directly with `file://` may show an incomplete page because browsers restrict the JavaScript modules used by the site. Use the launcher or run `npm run dev` and open the local URL it prints instead.

The structural audit snapshot is in `docs/structural-audit-production-2026-10-16.csv`.

## Contact Form

The project intake at `contact.html` is split into `assets/css/contact-page.css` and `assets/js/pages/contact-form.js`. This static source copy does not include `php/mail.php` or a server submission endpoint. The form prepares an email draft and a copyable brief; the visitor chooses whether to open their email app and send it. A server-backed submission flow requires a separately supplied endpoint and deployment configuration.
