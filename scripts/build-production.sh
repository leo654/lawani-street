#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_NAME="${1:-_site}"

case "$OUTPUT_NAME" in
  _site|dist) ;;
  *)
    printf 'Output must be either _site or dist.\n' >&2
    exit 2
    ;;
esac

OUTPUT_DIR="$ROOT_DIR/$OUTPUT_NAME"
if [[ "$OUTPUT_DIR" == "$ROOT_DIR" ]]; then
  printf 'Refusing to overwrite the project root.\n' >&2
  exit 2
fi

cd "$ROOT_DIR"
./scripts/production-check.sh

rm -rf "$OUTPUT_DIR"
LAWANI_OUTPUT_DIR="$OUTPUT_DIR" npm run build

mkdir -p "$OUTPUT_DIR/assets/favicons"
rsync -a \
  "$ROOT_DIR/robots.txt" \
  "$ROOT_DIR/sitemap.xml" \
  "$ROOT_DIR/.nojekyll" \
  "$OUTPUT_DIR/"
rsync -a "$ROOT_DIR/assets/favicons/" "$OUTPUT_DIR/assets/favicons/"

mkdir -p "$OUTPUT_DIR/assets/js/libs" "$OUTPUT_DIR/assets/js/modules"
rsync -a \
  "$ROOT_DIR/assets/js/libs/gsap.min.js" \
  "$ROOT_DIR/assets/js/libs/ScrollTrigger.min.js" \
  "$OUTPUT_DIR/assets/js/libs/"
rsync -a \
  "$ROOT_DIR/assets/js/modules/section-reveals.js" \
  "$OUTPUT_DIR/assets/js/modules/"

node "$ROOT_DIR/scripts/copy-production-media.mjs" "$ROOT_DIR" "$OUTPUT_DIR"

if rg -q --glob '*.css' '@import' "$OUTPUT_DIR/assets/build"; then
  printf 'Production CSS contains unresolved imports.\n' >&2
  exit 1
fi
node scripts/prune-production-duplicates.mjs "$OUTPUT_DIR"

artifact_size_kib="$(du -sk "$OUTPUT_DIR" | awk '{print $1}')"
max_artifact_size_kib=$((650 * 1024))
if (( artifact_size_kib > max_artifact_size_kib )); then
  printf 'Production artifact exceeds 650 MiB: %s KiB\n' "$artifact_size_kib" >&2
  exit 1
fi

printf 'Production site prepared at %s\n' "$OUTPUT_DIR"
