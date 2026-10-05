#!/usr/bin/env bash
# Locates and verifies release client bundles in the appsmithorg/cibuildcache repository.
#
# Every build variant owns one directory in the cache, and every bundle is stored next to a
# build-info.txt that records the variant and source tree it was built from.
#
# Usage:
#   client-build-cache.sh dir <repo-name> <variant>
#       Print the cache directory, relative to the cache repository root.
#   client-build-cache.sh info <variant> <source-checkout>
#       Print the build-info.txt content for a bundle built from <source-checkout>.
#   client-build-cache.sh verify <info-file> <variant> <source-checkout>
#       Decide whether the cached bundle stands in for a build of <source-checkout>.
#       Exit 0 when it was built from the same app/client tree.
#       Exit 3 when it was built from a different app/client tree, or when a default bundle
#       has no build-info.txt. The caller builds the bundle from source.
#       Exit 1 when the cached bundle belongs to another variant.
#
# <repo-name> is appsmith or appsmith-ee. <variant> is default or airgap.

set -euo pipefail

INFO_FILE_NAME="build-info.txt"
BUILD_FROM_SOURCE=3

edition_dir() {
  case "$1" in
    appsmith) echo "CE" ;;
    appsmith-ee) echo "EE" ;;
    *)
      echo "::error::Unknown repository '$1': expected appsmith or appsmith-ee" >&2
      return 1
      ;;
  esac
}

variant_dir() {
  case "$1" in
    default) echo "client" ;;
    airgap) echo "client-airgap" ;;
    *)
      echo "::error::Unknown client build variant '$1': expected default or airgap" >&2
      return 1
      ;;
  esac
}

cache_dir() {
  local edition variant
  edition="$(edition_dir "$1")"
  variant="$(variant_dir "$2")"
  echo "$edition/release/$variant"
}

client_tree() {
  git -C "$1" rev-parse "HEAD:app/client"
}

build_info() {
  local variant="$1" source_checkout="$2"
  variant_dir "$variant" >/dev/null
  echo "variant=$variant"
  echo "source_sha=$(git -C "$source_checkout" rev-parse HEAD)"
  echo "client_tree=$(client_tree "$source_checkout")"
  echo "run_url=${GITHUB_SERVER_URL:-}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-}"
}

info_value() {
  local info_file="$1" key="$2"
  grep -E "^${key}=" "$info_file" | head -n 1 | cut -d= -f2-
}

verify() {
  local info_file="$1" variant="$2" source_checkout="$3"
  variant_dir "$variant" >/dev/null

  if [[ ! -f "$info_file" ]]; then
    if [[ "$variant" == "default" ]]; then
      echo "::notice::Cached client bundle has no $INFO_FILE_NAME, so its source cannot be verified. Building the client from source."
      return "$BUILD_FROM_SOURCE"
    fi
    echo "::error::Cached $variant client bundle has no $INFO_FILE_NAME" >&2
    return 1
  fi

  echo "Cached client bundle:"
  cat "$info_file"

  local cached_variant cached_tree expected_tree
  cached_variant="$(info_value "$info_file" variant)"
  if [[ "$cached_variant" != "$variant" ]]; then
    echo "::error::Cached client bundle is variant '$cached_variant', but this build needs '$variant'" >&2
    return 1
  fi

  cached_tree="$(info_value "$info_file" client_tree)"
  expected_tree="$(client_tree "$source_checkout")"
  if [[ "$cached_tree" != "$expected_tree" ]]; then
    echo "::notice::Cached client bundle was built from app/client tree $cached_tree, but this checkout has $expected_tree. Building the client from source."
    return "$BUILD_FROM_SOURCE"
  fi
}

main() {
  local command="${1:-}"
  case "$command" in
    dir)
      [[ $# -eq 3 ]] || { echo "usage: $0 dir <repo-name> <variant>" >&2; return 2; }
      cache_dir "$2" "$3"
      ;;
    info)
      [[ $# -eq 3 ]] || { echo "usage: $0 info <variant> <source-checkout>" >&2; return 2; }
      build_info "$2" "$3"
      ;;
    verify)
      [[ $# -eq 4 ]] || { echo "usage: $0 verify <info-file> <variant> <source-checkout>" >&2; return 2; }
      verify "$2" "$3" "$4"
      ;;
    *)
      echo "usage: $0 {dir|info|verify} ..." >&2
      return 2
      ;;
  esac
}

main "$@"
