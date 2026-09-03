import { readFile, writeFile } from "node:fs/promises";

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/minify-css.mjs <input.css> <output.css>");
  process.exit(1);
}

const source = await readFile(inputPath, "utf8");
let result = "";
let quote = "";
let pendingSpace = false;

for (let index = 0; index < source.length; index += 1) {
  const character = source[index];
  const nextCharacter = source[index + 1];

  if (quote) {
    result += character;
    if (character === "\\") {
      result += nextCharacter ?? "";
      index += 1;
    } else if (character === quote) {
      quote = "";
    }
    continue;
  }

  if (character === '"' || character === "'") {
    if (pendingSpace && result && !/[(:;,{}]/.test(result.at(-1))) {
      result += " ";
    }
    pendingSpace = false;
    quote = character;
    result += character;
    continue;
  }

  if (character === "/" && nextCharacter === "*") {
    const commentEnd = source.indexOf("*/", index + 2);
    index = commentEnd === -1 ? source.length : commentEnd + 1;
    continue;
  }

  if (/\s/.test(character)) {
    pendingSpace = true;
    continue;
  }

  if (pendingSpace && result && !/[(:;,{}]/.test(result.at(-1)) && !/[(:;,{}]/.test(character)) {
    result += " ";
  }
  pendingSpace = false;
  result += character;
}

const quotedValues = [];
const quotedValuePattern = /(["'])(?:\\.|(?!\1)[\s\S])*\1/g;
const protectedResult = result.replace(quotedValuePattern, (quotedValue) => {
  const placeholder = `___LLCSSSTRING${quotedValues.length}___`;
  quotedValues.push(quotedValue);
  return placeholder;
});

result = protectedResult
  .replace(/\s*([{}:;,])\s*/g, "$1")
  .replace(/;}/g, "}")
  .replace(/___LLCSSSTRING(\d+)___/g, (_, index) => quotedValues[Number(index)])
  .trim();

await writeFile(outputPath, `${result}\n`);
console.log(`${inputPath}: ${source.length} bytes -> ${result.length} bytes`);
