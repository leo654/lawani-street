import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

const htmlPages = {
  '404-error': resolve(root, '404-error.html'),
  '404': resolve(root, '404.html'),
  'ademi': resolve(root, 'ademi.html'),
  'bpm': resolve(root, 'bpm.html'),
  'contact': resolve(root, 'contact.html'),
  'dsl': resolve(root, 'dsl.html'),
  'enterscale': resolve(root, 'enterscale.html'),
  'index': resolve(root, 'index.html'),
  'kicksjoint': resolve(root, 'kicksjoint.html'),
  'me': resolve(root, 'me.html'),
  'pitchdeck': resolve(root, 'pitchdeck.html'),
  'privacy': resolve(root, 'privacy.html'),
  'team': resolve(root, 'team.html'),
  'tyol': resolve(root, 'tyol.html'),
  'vatug': resolve(root, 'vatug.html'),
  'work': resolve(root, 'work.html'),
  // These three pages are standalone experiments and are also embedded by case studies.
  'bpm3': resolve(root, 'bpm3.html'),
  'kicksjoint-logo-motion': resolve(root, 'KICKSJOINT_Animated_Logo_Blinds.html'),
  'kicksjoint-icon-motion': resolve(root, 'kicksjoint-icons-animated-v6.html'),
};

export default defineConfig({
  root,
  base: "./",
  publicDir: false,
  build: {
    outDir: process.env.LAWANI_OUTPUT_DIR || "dist",
    emptyOutDir: true,
    assetsDir: "assets/build",
    rollupOptions: {
      input: htmlPages,
    },
  },
});
