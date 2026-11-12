# Lawanistreet

## Project Layout

- Public route pages stay at repository root (`*.html`). `vite.config.mjs` explicitly lists production routes, including embedded logo experiences used by case studies. Unreferenced experiments remain available in local development and are excluded from production.
- Media used by the site is grouped by owner: `assets/projects/<project>/{images,video}` for each case study, and `assets/site/{home,work,pitchdeck,shared}/` for everything else (favicons, portrait, site-wide video). Social share images stay in `assets/img/og/` because their URLs are public.
- Unused originals (large PNGs, raw video, alternate exports) live in `assets/_source/<project>/`. Nothing references them, so Vite never publishes them; they are safe to move or delete.
- `_archive/` holds retired material (the live-site mirror snapshot and zip, orphaned CSS/JS from earlier builds). It is excluded from the production route allowlist.
- Shared behavior lives in `assets/js/modules/`; route-specific behavior lives in `assets/js/pages/`.
- A single interactive component's behavior and presentation live in matching files under `assets/js/components/` and `assets/css/components/`. Page entries compose those component files.
- `assets/build/` is reserved for generated production output. Edit route source and component files instead.
- The spinning coffee cup in the home About section is a dependency-free canvas 3D renderer (`assets/js/components/cup-3d.js` + `assets/css/components/cup-3d.css`). It reads the theme ink/background colours, pauses off-screen, and `data-cup-sleeve` sets the lettering on the sleeve (a `|` starts a new line, and the type shrinks to fit the sleeve; it currently reads "Buy me|Coffee"). The cup can be dragged to spin (with momentum; touch swipes still scroll the page vertically), leans towards a mouse pointer and slows while hovered, and spins faster as the page scrolls; with reduced motion it stays still but can still be dragged.
- Shared motion timing is defined by `motion-system.css`. Page transitions live in `motion-system.js` (the `initPageTransitions` block): four vertical bands wipe up over the page on leave and off it on arrival, driven by the Web Animations API (transform only), so they stay smooth on the compositor even while the page is busy. The new page waits until fonts, the boot sequence and the first-screen images are ready (capped at about 1.4s) before the bands lift, and the page stays still behind them: the page intro in `motion-kit.js` starts only once the last band has cleared (`ll:page-cleared`). If a navigation fails, the curtain opens again after 6s. The curtain's z-index sits above the cookie notice via the `--ll-z-*` tokens in `design-tokens.css`; keep those at 5 digits or fewer, because the CSS minifier rounds longer numbers and merges values that are close together.
- Scroll smoothness: the footer wordmark's bevel and glow are blurred shadows on huge type that drifts with the page, so `footer-wordmark.js` sets `is-footer-scrolling` on the visible footer while the page scrolls and `nonstop-footer.css` drops those shadows until about 150ms after scrolling stops (the outlined wordmark itself never changes). The cup paints each ring of its wall as one polygon (`flat` branch in `cup-3d.js`) and reuses its buffers between frames; do not merge the rings into a single path, which rasterises far slower.
- First paint cover: Firefox paints a page as soon as its HTML arrives, even if the head stylesheet is still on the way, so a slow stylesheet showed the page unstyled for a moment. Every page therefore carries a small inline `<style id="ll-first-paint">` in its head (right after the early `mk-intro-pending` script) that draws a plain full-screen colour with `html::before` (the arrival colour after a page transition, orange on a first visit, otherwise the paper colour). The first rule in `design-tokens.css` (`html:root:root::before`) removes it the moment the stylesheet applies, and a 3.5s `ll-css-failsafe` timer removes it if the stylesheet never loads. New pages need the same inline block, and `design-tokens.css` must stay the first import of every entry stylesheet.
- Stillness and no tilting: nothing on the site tilts or skews as a decorative effect (the home cup stays upright, `MAX_LEAN` in `cup-3d.js` is 0; the case-study preview image follows the pointer without rotating; menu-row markers, pitch deck cards, the deck Close button and the hero headline no longer rotate or skew). Only icon shapes still turn (menu burger to X, the services plus to cross, fixed arrow directions). While a page transition runs the page behind the curtain holds still: on leaving, `motion-system.js` puts GSAP's ticker to sleep, pauses videos and pauses CSS transitions and animations (`freezePage`, plus the `animation-play-state` rule in `motion-system.css`), and thaws them if the navigation never happens; on arriving, the page intro waits for `ll:page-cleared` (the last band has gone) instead of starting while the bands lift.
- The preloader, split-text reveals, cursor, parallax and hover micro-interactions live in `motion-kit.css` / `motion-kit.js` (see the motion kit section in the architecture doc).
- Footers: Home, Privacy and 404 end with the Home footer (`ll-footer`); its styles are shared through `assets/css/site-footer.css` (pages with `ll-site-footer-page` on `<body>`), and its parallax/WebGL scripts load for any page that has it. Work and the case studies use the "Let's talk" `cs-footer` (with its wordmark and utility bar). Contact has no footer.
- Buttons use one system in `assets/css/button-unified.css`, imported last by every site entry (see its header for the classes and spacing rule).
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

Image size: browsers decode a whole image before drawing it, so keep source images at or below about 10 megapixels (roughly 3600px on the long edge, which is already sharp at 2x on a 1440px-wide layout). Images from 16 to 62 megapixels made the work and project pages stutter and can fail to display at all on iPhones; the oversized ones were reduced in place, and the originals are in `tmp/before-smoothness-2026-11-04/`.

Video rules: encode every video as H.264 (High, yuv420p) with AAC audio and `+faststart`; HEVC/H.265 does not play reliably in Firefox. Home-page videos carry a `poster` still so the page never shows an empty box when autoplay is blocked or reduced motion is on, and `home-ui.js` starts blocked videos on the first click, key press or touch. The About-section videos have no `autoplay` attribute: `home-ui.js` starts them when they approach the viewport, because starting them with the page can hold back the page's scripts in Safari on HTTP/1.1 servers (six connections per host).

## Local Preview

On macOS, double-click `Open Website.command` to start the local server and open the site in your browser. Keep the Terminal window open while browsing; close it to stop the server. If dependencies are not installed, run `npm ci` in Terminal in this folder first.

Opening an individual HTML file directly with `file://` may show an incomplete page because browsers restrict the JavaScript modules used by the site. Use the launcher or run `npm run dev` and open the local URL it prints instead.

See [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md) for page, CSS, JavaScript, media, and build conventions.

## Contact Form

The project intake at `contact.html` is split into `assets/css/contact-page.css` and `assets/js/pages/contact-form.js`. The site is hosted on GitHub Pages, so the form opens a prefilled email addressed to `talktolawanistreet@gmail.com`. The website does not submit or store inquiry data on a server.
