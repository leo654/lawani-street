# Frontend architecture

This project is a multi-page static site. HTML pages remain at the repository root, Vite owns the production build, and each page loads source entries. Generated output is disposable and is rebuilt from those sources.

## Source map

| Area | Owns |
| --- | --- |
| `*.html` | Route content, metadata, and semantic structure |
| `assets/partials/*.html` | Shared, build-time HTML fragments that remain static in the published pages |
| `assets/css/entries/` | CSS composition for each route family |
| `assets/css/components/` | Component-specific appearance, states, and motion |
| `assets/css/` shared files | Design tokens and shared site systems used by entries |
| `assets/js/site-entry.js` | Route detection and loading shared or route-specific behavior |
| `assets/js/modules/` | Behavior shared across multiple route families |
| `assets/js/pages/` | Behavior owned by a page or route family |
| `assets/js/components/` | Behavior owned by a discrete interactive component |
| `assets/projects/<project>/` | Images and video used by one case study (`images/`, `video/`) |
| `assets/site/` | Media used by the home, work, resume pages or shared by several pages (`home/`, `work/`, `pitchdeck/`, `shared/`) |
| `assets/_source/` | Unreferenced originals grouped by project; not published |
| `assets/media/` | Fonts and the web manifest only |
| `assets/build/` | Vite-generated production assets only |

## Route ownership

| Route family | CSS entry | JavaScript entry |
| --- | --- | --- |
| Home | `assets/css/entries/home.css` | `assets/js/site-entry.js` |
| Work archive | `assets/css/entries/work.css` | `assets/js/site-entry.js` |
| Case studies | `assets/css/entries/case-study.css` | `assets/js/site-entry.js` |
| Contact | `assets/css/entries/contact.css` | `assets/js/site-entry.js` |
| Pitch deck | `assets/css/entries/pitchdeck.css` | `assets/js/site-entry.js` |
| Privacy | `assets/css/entries/privacy.css` | `assets/js/site-entry.js` |
| Error routes | `assets/css/entries/error.css` | `assets/js/site-entry.js` |

`vite.config.mjs` is the production route allowlist. It includes three embedded logo experiences because live case studies load them in iframes; other experimental HTML stays outside the build unless deliberately added. `me.html` and `team.html` are lightweight redirects.

The homepage and work archive share `assets/partials/project-archive.html`. The Vite HTML partial plugin expands its marker during development and production builds, so both published routes keep their project content in the HTML without duplicating the archive source.

## Component convention

Keep a component's CSS and JavaScript under the same component name. CSS owns the visual treatment, focus/disabled states, and keyframes. JavaScript owns input handling, state changes, and preference-aware initialization. The page entry imports a component only on routes that contain it.

For example, the TYOL logo replay control is implemented in `assets/css/components/replay.css` and `assets/js/components/replay.js`. Buttons share one system: `assets/css/button-unified.css` is imported last by every site entry and owns button geometry, type, sizes (`--sm` 40px, default 50px, `--lg` 60px), variants (outline by default, `--solid`, `--glass`, `--media`, `--square`), the orange hover fill and the Hayler-style arrow reveal. Its header documents the anatomy and the symmetric spacing rule (one inset drives padding, gap and the icon tile). `button-system.css` still supplies context colours for older surfaces.

Use native buttons for actions and links for navigation. Give toggle buttons an accessible name and state (`aria-expanded`, `aria-pressed`, or `disabled`) that reflects what the control does. Any animation must have a reduced-motion behavior; do not leave a visible control active after its behavior has been disabled.

## Motion contract

`assets/css/motion-system.css` owns the site timing and easing tokens. Use the shared motion roles instead of introducing route-specific values for common interactions:

- `--motion-fast` for small feedback details
- `--motion-control` for button, filter, and text-color changes
- `--motion-component` for menus, panels, and short content transitions
- `--motion-reveal` for scroll-triggered entrances
- `--motion-expand` for archive and accordion expansion
- `--motion-page-cover` and `--motion-page-reveal` for route changes

JavaScript reads the computed CSS tokens through `assets/js/modules/constants.js`. Keep the longer media, hero, and presentation-slide timings separate where they support deliberate artwork or navigation. Keep entrance distances restrained and use the shared easing for UI and reveal motion. Every animated path must continue to respect `prefers-reduced-motion`.

### Motion kit

`assets/js/modules/motion-kit.js` and `assets/css/motion-kit.css` own the expressive motion language, loaded on every route right after `motion-system.js`:

- **Macro:** first-visit preloader (once per session), page intros after the preloader or the 4-panel page cover, home hero clip-and-scale entrance plus scroll parallax, clip-reveal + parallax media, stripe edges where light sections meet the dark footers. Every footer (home, work, project pages) behaves the same: stripe edge plus the wordmark reveal; the scroll-snap and content lift are opt-in via `data-mk-snap` and `data-mk-footer-lift`.
- **Micro:** headings split into characters that roll in from random order, paragraphs that rise line by line, lead copy that brightens word by word as you scroll, labels that decode from random glyphs, hover letter shuffles on menu, footer and related-work links, letter rolls on buttons, drawn rules, underlines, contextual cursor after Hayler (a small orange square that trails the real pointer, a faint highlight behind text links, word tags such as Play, Drag, View, Copy, and it fades over buttons), a scroll-velocity client marquee you can drag, drag-to-scroll project galleries, a related-work image follower, and copy-to-clipboard on visible email addresses.

The kit targets existing classes, so new markup usually needs nothing. To tune a single element use `data-mk-text="chars|lines|opacity|fill|decode|none"`, `data-cursor="Label"`, `data-mk-media`, `data-mk-rule`, `data-mk-stripes`, `data-mk-drag`, `data-mk-marquee`, `data-mk-spin="360"` or `data-mk-off`. Each page head carries a tiny inline script that adds `mk-preloading`, `mk-arriving` and `mk-intro-pending` so nothing flashes before the kit runs; the kit (or a 6 s failsafe) removes them.

The kit replaces `home-loader.js`, `elastic-cursor.js`, `scroll-text-reveals.js`, `media-reveals.js`, `button-text-rolls.js`, `section-reveals.js` and the scramble in `lamalama-ui.js`. Those files are no longer loaded; retired files are kept in `_archive/unused-code/` (the 2026-11-12 cleanup moved `page-footer.css`, `media-reveals.css`, `button-text-rolls.js` and `error-dots.js` there).

## Build and media rules

- Edit route and component sources. Do not edit content-hashed assets in `dist/assets/build/` or `_site/assets/build/`.
- Put a new image or video in `assets/projects/<project>/images|video/` (or `assets/site/...` if it is not tied to one project) and keep the original export in `assets/_source/<project>/`. Vite rewrites route references and emits the production copy into `assets/build/` inside the selected output folder.
- `npm run build` creates `dist/` for local production review.
- `npm run build:pages` creates the clean `_site/` artifact and copies `sitemap.xml` and `robots.txt` into it.
- Add a route to `vite.config.mjs` and assign it a CSS entry before publishing it.

Shared CSS modules that predate this convention remain in `assets/css/` and are composed by route entries. Move those modules into component files only when their ownership is clear and every consuming route is updated together.
