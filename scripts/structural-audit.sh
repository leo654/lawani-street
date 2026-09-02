#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

IGNORE_FILE=".structural-audit-ignore"
OUT_DIR="docs"
OUT_CSV="${OUT_DIR}/structural-audit-production-$(date +%F).csv"

if [[ "${1:-}" == "--out" && -n "${2:-}" ]]; then
  OUT_CSV="$2"
fi

is_ignored() {
  local file="$1"
  local pat
  [[ -f "$IGNORE_FILE" ]] || return 1
  while IFS= read -r pat; do
    [[ -z "$pat" ]] && continue
    [[ "$pat" =~ ^# ]] && continue
    [[ "$file" == $pat ]] && return 0
  done < "$IGNORE_FILE"
  return 1
}

mkdir -p "$(dirname "$OUT_CSV")"

{
  echo "file,type,doctype,lang,head,body,main_count,main_has_id,nav_count,nav_with_aria,loader_count,loader_with_aria,missing_local_entrypoints"
  while IFS= read -r file; do
    is_ignored "$file" && continue

    type="full"
    if rg -q 'http-equiv="refresh"' "$file"; then
      type="redirect"
    fi

    doctype=0; rg -qi '^<!doctype html>' "$file" && doctype=1
    lang=0; rg -q '<html[^>]*\blang=' "$file" && lang=1
    head=0; rg -q '<head>' "$file" && head=1
    body=0; rg -q '<body' "$file" && body=1

    main_count="$( (rg -o '<main\b' "$file" || true) | wc -l | tr -d ' ' )"
    main_has_id=0; rg -q '<main[^>]*\bid=' "$file" && main_has_id=1
    nav_count="$( (rg -o '<nav\b' "$file" || true) | wc -l | tr -d ' ' )"
    nav_with_aria="$( (rg -o '<nav[^>]*aria-label=' "$file" || true) | wc -l | tr -d ' ' )"
    loader_count="$( (rg -o '<div id="loader"' "$file" || true) | wc -l | tr -d ' ' )"
    loader_with_aria="$( (rg -o '<div id="loader"[^>]*aria-hidden=' "$file" || true) | wc -l | tr -d ' ' )"

    missing_refs=0
    while IFS= read -r ref; do
      case "$ref" in
        http*) continue ;;
      esac
      dir="$(dirname "$file")"
      if [[ "$dir" == "." ]]; then
        resolved="$ref"
      else
        resolved="$dir/$ref"
      fi
      [[ -f "$resolved" ]] || missing_refs=$((missing_refs + 1))
    done < <(
      {
        rg -No '<link[^>]+href="([^"]+\.css)"' "$file" | sed -E 's/.*href="([^"]+)".*/\1/' || true
        rg -No '<script[^>]+src="([^"]+\.js)"' "$file" | sed -E 's/.*src="([^"]+)".*/\1/' || true
      } | sort -u
    )

    echo "$file,$type,$doctype,$lang,$head,$body,$main_count,$main_has_id,$nav_count,$nav_with_aria,$loader_count,$loader_with_aria,$missing_refs"
  done < <(
    rg --files \
      -g '*.html' \
      -g '!_debug/**' \
      -g '!_site/**' \
      -g '!dist/**' \
      -g '!legacy/**' \
      -g '!assets/partials/**' \
      -g '!assets/fonts/**' \
      | sort
  )
} > "$OUT_CSV"

awk -F',' '
  NR == 1 { next }
  {
    total++
    if ($2 == "full") full++
    if ($2 == "redirect") redirect++
    if ($3 == 0) missing_doctype++
    if ($8 == 0) missing_main_id++
    if ($10 < $9) nav_missing_aria++
    if ($12 < $11) loader_missing_aria++
    if ($13 > 0) missing_refs++
  }
  END {
    printf("report=%s\n", out)
    printf("total_files=%d\n", total)
    printf("full_files=%d\n", full)
    printf("redirect_files=%d\n", redirect)
    printf("missing_doctype=%d\n", missing_doctype)
    printf("missing_main_id=%d\n", missing_main_id)
    printf("nav_missing_aria_files=%d\n", nav_missing_aria)
    printf("loader_missing_aria_files=%d\n", loader_missing_aria)
    printf("files_with_missing_local_entrypoints=%d\n", missing_refs)
  }
' out="$OUT_CSV" "$OUT_CSV"
