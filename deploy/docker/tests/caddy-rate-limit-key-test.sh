#!/usr/bin/env bash

# Security regression test for GHSA-qrgm-h8c4-jjf7 (Rate Limit Bypass via
# X-Forwarded-For Header Spoofing).
#
# The Caddy config emitted by caddy-reconfigure.mjs must not build the
# rate-limit bucket key from client-controlled headers, and must not trust
# every source IP as a proxy. Otherwise an unauthenticated attacker varies
# X-Forwarded-For per request to give each request its own rate-limit bucket,
# bypassing all Caddy rate limiting (login brute-force, credential stuffing,
# API flooding).
#
# This renders the Caddyfile directly (no container, no live Caddy) by running
# the generator with the caddy binary stubbed to a no-op, then asserts the
# security properties on the emitted Caddyfile. Mirrors the container-free unit
# style of docker-env-defaults-test.sh.

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
# Rate limiting must be ON so the rate_limit block is emitted.
export APPSMITH_RATE_LIMIT=100
export APPSMITH_CUSTOM_DOMAIN=""

node "$generator" --no-finalize-index-html

caddyfile="$TMP/Caddyfile"
if [[ ! -e "$caddyfile" ]]; then
  echo "FAILED: no Caddyfile was rendered at $caddyfile"
  exit 1
fi

fail=0

key_lines="$(grep -E '^[[:space:]]*key[[:space:]]+' "$caddyfile" || true)"

if [[ -z "$key_lines" ]]; then
  echo "FAILED: rate limiting is enabled but no rate-limit 'key' line was rendered"
  fail=$((fail + 1))
fi

# 1. The key must not reference client-controlled headers.
if printf '%s\n' "$key_lines" | grep -qiE '\{header\.X-Forwarded-For\}|\{header\.Forwarded\}'; then
  echo "FAILED: rate-limit key is built from client-controlled headers (spoofable):"
  printf '  %s\n' "$key_lines"
  fail=$((fail + 1))
else
  echo "OK: rate-limit key does not use client-controlled X-Forwarded-For / Forwarded headers"
fi

# 2. trusted_proxies must not trust the entire IPv4 space.
if grep -E 'trusted_proxies' "$caddyfile" | grep -qF '0.0.0.0/0'; then
  echo "FAILED: trusted_proxies trusts the entire IPv4 space (0.0.0.0/0):"
  grep -E 'trusted_proxies' "$caddyfile" | sed 's/^/  /'
  fail=$((fail + 1))
else
  echo "OK: trusted_proxies does not trust 0.0.0.0/0"
fi

# 3. Rate limiting must still be present and keyed on the trusted client IP.
if grep -qE 'rate_limit[[:space:]]*\{' "$caddyfile" \
    && printf '%s\n' "$key_lines" | grep -qF '{client_ip}'; then
  echo "OK: rate limiting is present and keyed on the trusted-resolved {client_ip}"
else
  echo "FAILED: rate limiting must remain enabled and keyed on {client_ip}:"
  printf '  %s\n' "$key_lines"
  fail=$((fail + 1))
fi

if [[ $fail -eq 0 ]]; then
  echo "SUCCEEDED!!!"
  exit 0
else
  echo "FAILED!!!"
  exit 1
fi
