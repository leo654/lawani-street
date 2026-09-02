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

printf 'Production site prepared at %s\n' "$OUTPUT_DIR"
