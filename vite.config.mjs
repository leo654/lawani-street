import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const projectArchivePath = resolve(root, "assets/partials/project-archive.html");
const projectArchiveRegion = /<!-- @include:project-archive:start -->[\s\S]*?<!-- @include:project-archive:end -->/;

function sharedHtmlPartials() {
  return {
    name: "lawani-shared-html-partials",
    transformIndexHtml: {
      order: "pre",
      async handler(html) {
        if (!projectArchiveRegion.test(html)) return html;
        if (typeof this.addWatchFile === "function") this.addWatchFile(projectArchivePath);
        const archive = await readFile(projectArchivePath, "utf8");
        return html.replace(projectArchiveRegion, archive.trim());
      },
    },
    configureServer(server) {
      server.watcher.add(projectArchivePath);
    },
    handleHotUpdate({ file, server }) {
      if (resolve(file) !== projectArchivePath) return;
      server.ws.send({ type: "full-reload" });
      return [];
    },
  };
}


// GitHub Pages serves 404.html at whatever (possibly nested) URL was missing, so its
// relative asset and link URLs would resolve against that path and break. When
// LAWANI_SITE_BASE is set (the Pages build), pin them to the site root with <base>.
function pagesNotFoundBase() {
  const siteBase = process.env.LAWANI_SITE_BASE;
  return {
    name: "lawani-pages-404-base",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (!siteBase || !/(^|\/)404\.html$/.test(ctx.filename || ctx.path || "")) return html;
        return html.replace(/<head([^>]*)>/i, `<head$1>\n    <base href="${siteBase}">`);
      },
    },
  };
}

// The pages carry ?v= cache keys on their CSS and JS links so a browser picks up edits while
// developing locally. Vite cannot inline a CSS @import that has a query string (the import is
// left as a broken URL in the build), and built files get content hashes anyway, so the
// keys are stripped at build time.
const cacheKey = /\?v=[\w.-]*/;
function stripCacheKeys() {
  return {
    name: "lawani-strip-cache-keys",
    apply: "build",
    enforce: "pre",
    transform(code, id) {
      if (!/\.css(\?|$)/.test(id) || !cacheKey.test(code)) return null;
      return { code: code.replace(/(@import\s+(?:url\()?["'][^"'?]+)\?v=[\w.-]*/g, "$1"), map: null };
    },
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html.replace(/((?:href|src|poster)=["'](?![a-z]+:|\/\/)[^"'?#]+)\?v=[\w.-]*/gi, "$1");
      },
    },
  };
}

const htmlPages = {
  '404': resolve(root, '404.html'),
  'ademi': resolve(root, 'ademi.html'),
  'bpm': resolve(root, 'bpm.html'),
  'bpm3': resolve(root, 'bpm3.html'),
  'contact': resolve(root, 'contact.html'),
  'dsl': resolve(root, 'dsl.html'),
  'enterscale': resolve(root, 'enterscale.html'),
  'index': resolve(root, 'index.html'),
  'KICKSJOINT_Animated_Logo_Blinds': resolve(root, 'KICKSJOINT_Animated_Logo_Blinds.html'),
  'kicksjoint': resolve(root, 'kicksjoint.html'),
  'kicksjoint-icons-animated-v6': resolve(root, 'kicksjoint-icons-animated-v6.html'),
  'me': resolve(root, 'me.html'),
  'pitchdeck': resolve(root, 'pitchdeck.html'),
  'privacy': resolve(root, 'privacy.html'),
  'team': resolve(root, 'team.html'),
  'tyol': resolve(root, 'tyol.html'),
  'vatug': resolve(root, 'vatug.html'),
  'work': resolve(root, 'work.html'),
};

export default defineConfig({
  root,
  base: "./",
  publicDir: false,
  plugins: [stripCacheKeys(), sharedHtmlPartials(), pagesNotFoundBase()],
  build: {
    outDir: process.env.LAWANI_OUTPUT_DIR || "dist",
    emptyOutDir: true,
    assetsDir: "assets/build",
    rollupOptions: {
      input: htmlPages,
    },
  },
});
