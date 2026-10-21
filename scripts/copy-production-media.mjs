import { copyFile, mkdir, readdir, readFile, stat } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

const [sourceArg, outputArg] = process.argv.slice(2);
if (!sourceArg || !outputArg) {
  console.error("Usage: node scripts/copy-production-media.mjs <source-root> <output-root>");
  process.exit(2);
}

const sourceRoot = resolve(sourceArg);
const outputRoot = resolve(outputArg);
const mediaKinds = new Set(["img", "video", "fonts"]);
const extensionPattern = /\.(?:avif|gif|jpe?g|mov|mp3|mp4|ogg|png|svg|ttf|webm|webp|woff2?)$/i;
const referencePattern = /(?:\.\/|\/)?assets\/(img|video|fonts)\/([^"'<>?#]*?\.(?:avif|gif|jpe?g|mov|mp3|mp4|ogg|png|svg|ttf|webm|webp|woff2?))(?=$|[?#"'<>\s)])/gi;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

const textFiles = (await walk(outputRoot)).filter((file) => {
  const relativePath = relative(outputRoot, file).split(sep).join("/");
  return !relativePath.startsWith("assets/img/") &&
    !relativePath.startsWith("assets/video/") &&
    !relativePath.startsWith("assets/fonts/") &&
    /\.(?:css|html|js|json|mjs|webmanifest)$/i.test(file);
});

const referenced = new Set();
for (const file of textFiles) {
  const content = await readFile(file, "utf8");
  for (const match of content.matchAll(referencePattern)) {
    const kind = match[1];
    if (mediaKinds.has(kind)) {
      let assetPath = match[2];
      try { assetPath = decodeURIComponent(assetPath); } catch {}
      referenced.add(resolve(sourceRoot, "assets", kind, assetPath));
    }
  }
}

let copied = 0;
for (const sourcePath of referenced) {
  if (!extensionPattern.test(sourcePath)) continue;
  const sourceStat = await stat(sourcePath).catch(() => null);
  if (!sourceStat?.isFile()) continue;
  const targetPath = resolve(outputRoot, relative(sourceRoot, sourcePath));
  await mkdir(dirname(targetPath), { recursive: true });
  await copyFile(sourcePath, targetPath);
  copied += 1;
}

console.log(`Copied ${copied} runtime-referenced source media files.`);
