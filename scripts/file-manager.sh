#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CMD="${1:-status}"
SUBMODE="${2:-assets}"

print_help() {
  cat <<'HELP'
Usage: scripts/file-manager.sh <command>

Commands:
  status       Show top-level structure and asset sizes
  largest      Show largest files in the repository
  check-links [assets|all]
              Validate local src/href/poster references in HTML
  help         Show this help
HELP
}

status() {
  echo "Repository: $ROOT"
  echo
  echo "Top-level folders:"
  find "$ROOT" -mindepth 1 -maxdepth 1 -type d ! -name '.git' -exec basename {} \; | sort
  echo
  echo "Top-level size summary:"
  (
    cd "$ROOT"
    du -sh assets docs legacy php scss scripts 2>/dev/null || true
  )
}

largest() {
  (
    cd "$ROOT"
    find . -type f ! -path './.git/*' ! -name '.DS_Store' -exec du -h {} + | sort -hr | head -n 30
  )
}

check_links() {
  local mode="${1:-assets}"
  local tmp_refs tmp_missing
  tmp_refs="$(mktemp)"
  tmp_missing="$(mktemp)"

  (
    cd "$ROOT"
    perl -ne 'while (/(?:src|href|poster)=["'"'"']([^"'"'"']+)["'"'"']/g) { print "$ARGV\t$1\n"; }' *.html
  ) > "$tmp_refs"

  while IFS=$'\t' read -r file ref; do
    local path check_path
    path="${ref%%\#*}"
    path="${path%%\?*}"

    case "$path" in
      ""|"#"*|http:*|https:*|mailto:*|tel:*|javascript:*|data:*|//* ) continue ;;
    esac

    if [[ "$path" == */ ]]; then
      continue
    fi

    if [[ "$mode" == "assets" && "$path" =~ \.(html?|php)$ ]]; then
      continue
    fi

    if [[ "$path" == /* ]]; then
      check_path="$ROOT/${path#/}"
    else
      check_path="$ROOT/$path"
    fi

    if [[ ! -e "$check_path" ]]; then
      printf '%s\t%s\n' "$file" "$ref" >> "$tmp_missing"
    fi
  done < "$tmp_refs"

  if [[ -s "$tmp_missing" ]]; then
    echo "Missing local references:"
    sort -u "$tmp_missing"
    rm -f "$tmp_refs" "$tmp_missing"
    return 1
  fi

  echo "No missing local HTML references found."
  rm -f "$tmp_refs" "$tmp_missing"
}

case "$CMD" in
  status) status ;;
  largest) largest ;;
  check-links) check_links "$SUBMODE" ;;
  help|-h|--help) print_help ;;
  *) print_help; exit 2 ;;
esac
