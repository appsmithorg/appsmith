#!/usr/bin/env bash

# Unit test for compose_redis_url_from_parts() in
# deploy/docker/fs/opt/appsmith/entrypoint.sh.
#
# That function lets operators configure Redis from the discrete values a secret
# store (e.g. AWS Secrets Manager for ElastiCache) exposes — host, port, password —
# instead of hand-assembling APPSMITH_REDIS_URL. This test exercises the composition
# rules without needing a container: it extracts just the function definition from
# the entrypoint (so the test always runs the shipped implementation) and invokes it
# against a matrix of inputs.

set -o errexit
set -o nounset
set -o pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
entrypoint="$script_dir/../fs/opt/appsmith/entrypoint.sh"

if [[ ! -e "$entrypoint" ]]; then
  echo "FAILED: entrypoint not found at $entrypoint"
  exit 1
fi

# Extract the compose_redis_url_from_parts function definition (from its line up to
# the closing brace at column 0) and source it in isolation. This avoids running the
# entrypoint's main section or its other `source` dependencies.
fn_source="$(awk '/^compose_redis_url_from_parts\(\) \{/{flag=1} flag{print} /^\}/{if(flag){exit}}' "$entrypoint")"

if [[ -z "$fn_source" ]]; then
  echo "FAILED: could not extract compose_redis_url_from_parts from $entrypoint"
  exit 1
fi

# Stub tlog (defined elsewhere in the entrypoint) so the function is self-contained.
tlog() { :; }

eval "$fn_source"

fail=0

# Helper: run the function in a clean env and assert the resulting APPSMITH_REDIS_URL.
# Usage: assert_url "<description>" "<expected>" VAR=value VAR=value ...
assert_url() {
  local description="$1"; shift
  local expected="$1"; shift

  # Clear all inputs, then apply only what the case specifies.
  unset APPSMITH_REDIS_URL APPSMITH_REDIS_HOST APPSMITH_REDIS_PORT \
        APPSMITH_REDIS_PASSWORD APPSMITH_REDIS_TLS APPSMITH_REDIS_SSL

  local kv
  for kv in "$@"; do
    export "${kv?}"
  done

  compose_redis_url_from_parts

  local actual="${APPSMITH_REDIS_URL:-}"
  if [[ "$actual" == "$expected" ]]; then
    echo "OK: $description"
  else
    echo "FAILED: $description"
    echo "  expected: '$expected'"
    echo "  actual:   '$actual'"
    fail=$((fail + 1))
  fi
}

# 1. Host + port + password -> full redis:// URL.
assert_url "host+port+password composes a full URL" \
  "redis://:s3cret@redis.example.com:6379" \
  APPSMITH_REDIS_HOST=redis.example.com APPSMITH_REDIS_PORT=6379 APPSMITH_REDIS_PASSWORD=s3cret

# 2. Port defaults to 6379 when omitted.
assert_url "port defaults to 6379" \
  "redis://:pw@redis.example.com:6379" \
  APPSMITH_REDIS_HOST=redis.example.com APPSMITH_REDIS_PASSWORD=pw

# 3. Custom port is honored.
assert_url "custom port is honored" \
  "redis://:pw@redis.example.com:6380" \
  APPSMITH_REDIS_HOST=redis.example.com APPSMITH_REDIS_PORT=6380 APPSMITH_REDIS_PASSWORD=pw

# 4. No password -> passwordless URL (no userinfo, no stray colon/at).
assert_url "no password yields a passwordless URL" \
  "redis://redis.example.com:6379" \
  APPSMITH_REDIS_HOST=redis.example.com

# 5. TLS flag selects the rediss:// scheme.
assert_url "APPSMITH_REDIS_TLS=true selects rediss scheme" \
  "rediss://:pw@redis.example.com:6379" \
  APPSMITH_REDIS_HOST=redis.example.com APPSMITH_REDIS_PASSWORD=pw APPSMITH_REDIS_TLS=true

# 6. SSL flag (alias) also selects rediss://.
assert_url "APPSMITH_REDIS_SSL=true selects rediss scheme" \
  "rediss://:pw@redis.example.com:6379" \
  APPSMITH_REDIS_HOST=redis.example.com APPSMITH_REDIS_PASSWORD=pw APPSMITH_REDIS_SSL=true

# 7. An explicit APPSMITH_REDIS_URL always wins (components are ignored).
assert_url "explicit APPSMITH_REDIS_URL takes precedence over components" \
  "redis://:original@custom.example:6379" \
  APPSMITH_REDIS_URL=redis://:original@custom.example:6379 \
  APPSMITH_REDIS_HOST=redis.example.com APPSMITH_REDIS_PASSWORD=ignored

# 8. Neither URL nor host set -> nothing is composed (URL stays empty).
assert_url "no host and no URL leaves APPSMITH_REDIS_URL empty" \
  "" \
  APPSMITH_REDIS_PASSWORD=orphan

# 9. Special characters in the password are URL-encoded so the URL stays valid.
assert_url "special characters in password are URL-encoded" \
  "redis://:p%40ss%2Fwo%3Ard%23@redis.example.com:6379" \
  APPSMITH_REDIS_HOST=redis.example.com 'APPSMITH_REDIS_PASSWORD=p@ss/wo:rd#'

if [[ $fail -eq 0 ]]; then
  echo "SUCCEEDED!!!"
  exit 0
else
  echo "FAILED!!!"
  exit 1
fi
