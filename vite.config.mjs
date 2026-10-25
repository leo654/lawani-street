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

const htmlPages = {
  '404-error': resolve(root, '404-error.html'),
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
  plugins: [sharedHtmlPartials()],
  build: {
    outDir: process.env.LAWANI_OUTPUT_DIR || "dist",
    emptyOutDir: true,
    assetsDir: "assets/build",
    rollupOptions: {
      input: htmlPages,
    },
  },
});
