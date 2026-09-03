#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cd "$ROOT_DIR"

./scripts/structural-audit.sh --out "$TMP_DIR/structural-audit.csv"
./scripts/file-manager.sh check-links all

if awk -F',' '
  NR > 1 && ($3 == 0 || $4 == 0 || $5 == 0 || $6 == 0 || $7 != 1 || $8 == 0 || $10 < $9 || $12 < $11 || $13 > 0) {
    invalid = 1
  }
  END { exit invalid ? 0 : 1 }
' "$TMP_DIR/structural-audit.csv"; then
  printf 'Structural audit found production-blocking issues.\n' >&2
  exit 1
fi

while IFS= read -r -d '' file; do
  node --check "$file" >/dev/null
done < <(find assets/js -type f -name '*.js' -print0)

for required_file in index.html 404.html robots.txt sitemap.xml .nojekyll; do
  if [[ ! -f "$required_file" ]]; then
    printf 'Missing required production file: %s\n' "$required_file" >&2
    exit 1
  fi
done

while IFS= read -r ignored_asset; do
  [[ -z "$ignored_asset" || "$ignored_asset" == \#* ]] && continue
  asset_name="${ignored_asset##*/}"
  if rg -F -q --glob '*.html' --glob '*.css' --glob '*.js' -- "$asset_name" ./*.html assets/css assets/js assets/partials; then
    printf 'Ignored production asset is referenced by active code: %s\n' "$ignored_asset" >&2
    exit 1
  fi
done < scripts/production-assets-ignore.txt

if rg -q 'https://lawanistreet\.com' ./*.html; then
  printf 'Found metadata pointing at the inactive lawanistreet.com host.\n' >&2
  exit 1
fi

printf 'Production checks passed.\n'
