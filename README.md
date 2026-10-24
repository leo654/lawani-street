# Lawanistreet

## Project Layout

- Public route pages stay at repository root (`*.html`). `vite.config.mjs` explicitly lists production routes, including embedded logo experiences used by case studies. Unreferenced experiments remain available in local development and are excluded from production.
- Source media used by route pages lives in `assets/media/`; shared source assets and libraries live in their corresponding `assets/` folders.
- `lawani-street-live-mirror/` and `lawani-street-live-mirror.zip` are reference snapshots and are excluded from the production route allowlist.
- Shared behavior lives in `assets/js/modules/`; route-specific behavior lives in `assets/js/pages/`.
- A single interactive component's behavior and presentation live in matching files under `assets/js/components/` and `assets/css/components/`. Page entries compose those component files.
- `assets/build/` is reserved for generated production output. Edit route source and component files instead.
- Shared motion timing and page transitions are defined by `motion-system.css` and `motion-system.js`.
- Resume links use one preloaded full-screen fade in `pitchdeck-overlay.css` / `pitchdeck-overlay.js`; the isolated `pitchdeck.html` controller owns only slide navigation and remains directly accessible.
- Full-screen overlays suspend background video and halftone rendering, then restore only media that was previously playing.

Build the production pages and prepare the static artifact used by GitHub Pages:

```bash
npm ci
npm run build
npm run build:pages
```

The production build uses Vite to process linked CSS and emit content-hashed assets while preserving the static HTML routes. The published site is `https://leo654.github.io/lawani-street/`. Its canonical URLs, social metadata, sitemap, and robots file use that production origin.

The Pages artifact has a 650 MiB size ceiling. Where a visually equivalent WebP delivery image exists, page references use it to reduce transfer size; social preview metadata keeps crawler-compatible PNG/JPG images. Large project videos use 720p H.264 MP4 delivery variants.

## Local Preview

On macOS, double-click `Open Website.command` to start the local server and open the site in your browser. Keep the Terminal window open while browsing; close it to stop the server. If dependencies are not installed, run `npm ci` in Terminal in this folder first.

Opening an individual HTML file directly with `file://` may show an incomplete page because browsers restrict the JavaScript modules used by the site. Use the launcher or run `npm run dev` and open the local URL it prints instead.

See [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md) for page, CSS, JavaScript, media, and build conventions.

## Contact Form

The project intake at `contact.html` is split into `assets/css/contact-page.css` and `assets/js/pages/contact-form.js`. The site is hosted on GitHub Pages, so the form opens a prefilled email addressed to `talktolawanistreet@gmail.com`. The website does not submit or store inquiry data on a server.
