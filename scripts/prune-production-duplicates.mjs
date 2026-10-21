import { createHash } from "node:crypto";
import { createReadStream, readFileSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

const outputDir = resolve(process.argv[2] || "");
if (!process.argv[2] || !statSync(outputDir, { throwIfNoEntry: false })?.isDirectory()) {
  console.error("Provide an existing production output directory.");
  process.exit(2);
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = resolve(directory, entry.name);
    return entry.isDirectory() ? listFiles(file) : [file];
  });
}

async function fileHash(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

const buildDir = resolve(outputDir, "assets/build");
if (!statSync(buildDir, { throwIfNoEntry: false })?.isDirectory()) {
  console.error(`Production build assets not found: ${buildDir}`);
  process.exit(2);
}

const builtHashes = new Set();
for (const file of listFiles(buildDir)) builtHashes.add(await fileHash(file));

const textFiles = listFiles(outputDir).filter((file) =>
  !file.startsWith(buildDir + sep) && /\.(?:html|css|js|mjs|json|webmanifest)$/i.test(file)
);
const outputText = textFiles.map((file) => ({
  directory: resolve(file, ".."),
  content: readFileSync(file, "utf8"),
}));

let removedFiles = 0;
let removedBytes = 0;
for (const directory of ["assets/img", "assets/video", "assets/fonts"]) {
  const sourceDir = resolve(outputDir, directory);
  if (!statSync(sourceDir, { throwIfNoEntry: false })?.isDirectory()) continue;

  for (const file of listFiles(sourceDir)) {
    if (!builtHashes.has(await fileHash(file))) continue;

    const sourcePath = relative(outputDir, file).split(sep).join("/");
    const isReferenced = outputText.some(({ directory: textDirectory, content }) => {
      const relativePath = relative(textDirectory, file).split(sep).join("/");
      return [sourcePath, `./${sourcePath}`, `/${sourcePath}`, relativePath, encodeURI(relativePath)]
        .some((candidate) => candidate && content.includes(candidate));
    });
    if (isReferenced) continue;

    removedBytes += statSync(file).size;
    unlinkSync(file);
    removedFiles += 1;
  }
}

console.log(
  `Removed ${removedFiles} duplicate source assets from production output (${(removedBytes / 1024 / 1024).toFixed(1)} MiB).`
);
