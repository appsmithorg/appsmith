#!/usr/bin/env bash

# Uploaded images (assets and profile photos) are served from the instance
# origin. A stored SVG opened directly must not run script there, so Caddy sets
# a sandbox CSP on those routes itself, replacing whatever the backend sent, and
# keeps the frame-ancestors-only policy for every other route.
#
# This renders the Caddyfile directly (no container, no live Caddy) by running
# the generator with the caddy binary stubbed to a no-op, then asserts on the
# emitted Caddyfile. route-tests/common/asset-csp.hurl covers the header
# behaviour against a live Caddy.

set -o errexit
set -o nounset
set -o pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
generator="$script_dir/../fs/opt/appsmith/caddy-reconfigure.mjs"

if [[ ! -e "$generator" ]]; then
  echo "FAILED: generator not found at $generator"
  exit 1
fi

workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

export TMP="$workdir"
export WWW_PATH="$workdir/www"
mkdir -p "$WWW_PATH"
# Stub the caddy binary the generator shells out to (`caddy fmt` / `caddy
# reload`) with a no-op so rendering needs no live Caddy.
export _APPSMITH_CADDY=true
export APPSMITH_CUSTOM_DOMAIN=""
export APPSMITH_ALLOWED_FRAME_ANCESTORS=""

node "$generator" --no-finalize-index-html

caddyfile="$TMP/Caddyfile"
if [[ ! -e "$caddyfile" ]]; then
  echo "FAILED: no Caddyfile was rendered at $caddyfile"
  exit 1
fi

image_paths="/api/v1/assets/* /api/v1/users/photo /api/v1/users/photo/*"
sandbox_csp="Content-Security-Policy \"frame-ancestors 'self'; sandbox; default-src 'none'; style-src 'unsafe-inline'\""
plain_csp="Content-Security-Policy \"frame-ancestors 'self'\""

fail=0

pass() {
  echo "OK: $1"
}

failed() {
  echo "FAILED: $1"
  fail=$((fail + 1))
}

# Prints each `header @<name> { ... }` block on one line, so its contents can be checked together.
header_block() {
  awk -v name="$1" '
    $0 ~ "header[[:space:]]+@" name "[[:space:]]*\\{" { inside = 1 }
    inside { printf "%s ", $0 }
    inside && /\}/ { inside = 0; print "" }
  ' "$caddyfile"
}

if grep -qF "@image-path path $image_paths" "$caddyfile"; then
  pass "image-serving routes are matched by @image-path"
else
  failed "image-serving routes are matched by @image-path"
fi

if grep -qF "@not-image-path not path $image_paths" "$caddyfile"; then
  pass "every other route is matched by @not-image-path"
else
  failed "every other route is matched by @not-image-path"
fi

image_block="$(header_block image-path)"
if [[ "$image_block" == *"$sandbox_csp"* && "$image_block" =~ (^|[[:space:]])defer([[:space:]]|$) ]]; then
  pass "@image-path gets frame-ancestors plus the sandbox policy, deferred"
else
  failed "@image-path gets frame-ancestors plus the sandbox policy, deferred: $image_block"
fi

not_image_block="$(header_block not-image-path)"
if [[ "$not_image_block" == *"$plain_csp"* && "$not_image_block" =~ (^|[[:space:]])defer([[:space:]]|$) ]]; then
  pass "@not-image-path gets the frame-ancestors-only policy, deferred"
else
  failed "@not-image-path gets the frame-ancestors-only policy, deferred: $not_image_block"
fi

csp_count="$(grep -cE '^[[:space:]]*Content-Security-Policy[[:space:]]' "$caddyfile" || true)"
if [[ "$csp_count" -eq 2 ]]; then
  pass "no Content-Security-Policy is set outside the two matcher blocks"
else
  failed "expected exactly 2 Content-Security-Policy lines, found $csp_count"
fi

if [[ $fail -eq 0 ]]; then
  echo "SUCCEEDED!!!"
  exit 0
else
  echo "FAILED!!!"
  exit 1
fi
