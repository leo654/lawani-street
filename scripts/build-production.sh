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
mkdir -p "$OUTPUT_DIR"

rsync -a \
  --exclude-from "$ROOT_DIR/scripts/production-assets-ignore.txt" \
  --exclude '/.git/' \
  --exclude '/.github/' \
  --exclude '/.vscode/' \
  --exclude '/docs/' \
  --exclude '/legacy/' \
  --exclude '/php/' \
  --exclude '/scripts/' \
  --exclude '/scss/' \
  --exclude "/$OUTPUT_NAME/" \
  --exclude '/.DS_Store' \
  --exclude '/.gitattributes' \
  --exclude '/.gitignore' \
  --exclude '/README.md' \
  --exclude '/STRUCTURE.md' \
  --exclude '*.scss' \
  ./ "$OUTPUT_DIR/"

artifact_size_kib="$(du -sk "$OUTPUT_DIR" | awk '{print $1}')"
if (( artifact_size_kib > 1048576 )); then
  printf 'Production artifact exceeds 1 GiB: %s KiB\n' "$artifact_size_kib" >&2
  exit 1
fi

printf 'Production site prepared at %s\n' "$OUTPUT_DIR"
