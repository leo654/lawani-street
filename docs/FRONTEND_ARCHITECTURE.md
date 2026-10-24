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
| `assets/media/` | Source images, video, fonts, icons, and web manifest |
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

For example, the TYOL logo replay control is implemented in `assets/css/components/replay.css` and `assets/js/components/replay.js`. Shared button geometry and focus treatment remain in `assets/css/button-system.css`.

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

## Build and media rules

- Edit route and component sources. Do not edit content-hashed assets in `dist/assets/build/` or `_site/assets/build/`.
- Keep source media in `assets/media/`. Vite rewrites route references and emits the production copy into `assets/build/` inside the selected output folder.
- `npm run build` creates `dist/` for local production review.
- `npm run build:pages` creates the clean `_site/` artifact and copies `sitemap.xml` and `robots.txt` into it.
- Add a route to `vite.config.mjs` and assign it a CSS entry before publishing it.

Shared CSS modules that predate this convention remain in `assets/css/` and are composed by route entries. Move those modules into component files only when their ownership is clear and every consuming route is updated together.
