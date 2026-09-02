# Lawanistreet

## Project Layout

- Entry pages stay at repository root (`*.html`).
- All static runtime files are under `assets/` (`css`, `js`, `img`, `fonts`, `video`, `favicons`, `slide`).
- Archived root-level legacy files are in `legacy/unused-root/`.
- Shared behavior lives in `assets/js/modules/`; route-specific behavior lives in `assets/js/pages/`.
- Shared motion timing and page transitions are defined by `motion-system.css` and `motion-system.js`.
- Resume links use one preloaded full-screen fade in `pitchdeck-overlay.css` / `pitchdeck-overlay.js`; the isolated `pitchdeck.html` controller owns only slide navigation and remains directly accessible.
- Full-screen overlays suspend background video and halftone rendering, then restore only media that was previously playing.

## File Management

```bash
./scripts/file-manager.sh status
./scripts/file-manager.sh largest
./scripts/file-manager.sh check-links
```

For a full-page/link validation run:

```bash
./scripts/file-manager.sh check-links all
```

Run the complete production validation and prepare the same clean artifact used by GitHub Pages:

```bash
./scripts/production-check.sh
./scripts/build-production.sh _site
```

The published site is `https://leo654.github.io/lawani-street/`. Its canonical URLs, social metadata, sitemap, and robots file use that production origin. The Pages build excludes development files, archived files, the PHP endpoint, and unused heavyweight source assets listed in `scripts/production-assets-ignore.txt`.

See `docs/FILE_MANAGEMENT.md` for conventions.

## Contact Form

The project intake at `vcard.html` is split into `assets/css/contact-page.css` and `assets/js/pages/contact-form.js`. It posts to `php/mail.php` and delivers to `talktolawanistreet@gmail.com`. For production, deploy behind a PHP-capable server and configure:

- `CONTACT_FROM` (optional, falls back to the delivery address)
- `CONTACT_FROM_NAME` (optional)
- `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_PORT`, `SMTP_ENCRYPTION` (optional SMTP delivery)

Without `SMTP_*`, the endpoint falls back to local `mail()`. GitHub Pages cannot run PHP, so the production contact form opens a prefilled email instead; PHP delivery remains available when the source is deployed to a PHP-capable server.
