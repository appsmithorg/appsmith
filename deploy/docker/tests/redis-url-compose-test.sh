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

# Extract the Redis helper function definitions (each from its line up to the closing
# brace at column 0) into a temp file and source it in isolation. This avoids running
# the entrypoint's main section or its other `source` dependencies.
fn_file="$(mktemp)"
trap 'rm -f "$fn_file"' EXIT

for fn in redis_host_is_local redis_url_is_local compose_redis_url_from_parts persist_composed_redis_url; do
  if ! awk -v fn="$fn" '$0 ~ "^" fn "\\(\\) \\{" {flag=1} flag{print} /^\}/{if(flag){exit}}' "$entrypoint" > "$fn_file.part" \
    || [[ ! -s "$fn_file.part" ]]; then
    echo "FAILED: could not extract $fn from $entrypoint"
    rm -f "$fn_file.part"
    exit 1
  fi
  cat "$fn_file.part" >> "$fn_file"
  rm -f "$fn_file.part"
done

# Stub tlog (defined elsewhere in the entrypoint) so the functions are self-contained.
tlog() { :; }

# shellcheck source=/dev/null
source "$fn_file"

fail=0

# Helper: run the function in a clean env and assert the resulting APPSMITH_REDIS_URL.
# Usage: assert_url "<description>" "<expected>" VAR=value VAR=value ...
assert_url() {
  local description="$1"; shift
  local expected="$1"; shift

  # Clear all inputs, then apply only what the case specifies.
  unset APPSMITH_REDIS_URL APPSMITH_REDIS_HOST APPSMITH_REDIS_PORT \
        APPSMITH_REDIS_PASSWORD APPSMITH_REDIS_TLS APPSMITH_REDIS_SSL \
        APPSMITH_REDIS_URL_EXTERNAL APPSMITH_REDIS_PASSWORD_EXTERNAL \
        REDIS_URL_COMPOSED

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

# 10. The generated embedded-Redis defaults from docker.env (URL + password) must not
#     block composition nor leak their password into the external URL.
assert_url "generated docker.env defaults are ignored when a host is set" \
  "redis://redis.example.com:6379" \
  APPSMITH_REDIS_URL=redis://:generated@127.0.0.1:6379 APPSMITH_REDIS_PASSWORD=generated \
  APPSMITH_REDIS_URL_EXTERNAL= APPSMITH_REDIS_PASSWORD_EXTERNAL= \
  APPSMITH_REDIS_HOST=redis.example.com

# 11. An externally supplied password is used while the generated URL is ignored.
assert_url "external password is used with generated defaults present" \
  "redis://:ext@redis.example.com:6379" \
  APPSMITH_REDIS_URL=redis://:generated@127.0.0.1:6379 APPSMITH_REDIS_PASSWORD=ext \
  APPSMITH_REDIS_URL_EXTERNAL= APPSMITH_REDIS_PASSWORD_EXTERNAL=ext \
  APPSMITH_REDIS_HOST=redis.example.com

# 12. A localhost host falls back to the generated embedded-Redis password.
assert_url "localhost host uses the generated embedded Redis password" \
  "redis://:generated@127.0.0.1:6379" \
  APPSMITH_REDIS_PASSWORD=generated APPSMITH_REDIS_URL_EXTERNAL= \
  APPSMITH_REDIS_PASSWORD_EXTERNAL= APPSMITH_REDIS_HOST=127.0.0.1

# 13. The hostname "localhost" also falls back to the generated password.
assert_url "localhost hostname uses the generated embedded Redis password" \
  "redis://:generated@localhost:6379" \
  APPSMITH_REDIS_PASSWORD=generated APPSMITH_REDIS_URL_EXTERNAL= \
  APPSMITH_REDIS_PASSWORD_EXTERNAL= APPSMITH_REDIS_HOST=localhost

# 14. Bracketed IPv6 hosts are accepted as-is.
assert_url "remote bracketed IPv6 host is accepted" \
  "redis://[2001:db8::1]:6379" \
  APPSMITH_REDIS_HOST='[2001:db8::1]'

# 14b. The IPv6 loopback is local and uses the generated embedded Redis password.
assert_url "[::1] uses the generated embedded Redis password" \
  "redis://:generated@[::1]:6379" \
  APPSMITH_REDIS_PASSWORD=generated APPSMITH_REDIS_URL_EXTERNAL= \
  APPSMITH_REDIS_PASSWORD_EXTERNAL= APPSMITH_REDIS_HOST='[::1]'

# 15. Hosts that would corrupt the URL authority are rejected.
unset APPSMITH_REDIS_URL APPSMITH_REDIS_PASSWORD APPSMITH_REDIS_URL_EXTERNAL APPSMITH_REDIS_PASSWORD_EXTERNAL
export APPSMITH_REDIS_HOST='user@redis.example.com'
if compose_redis_url_from_parts && [[ -z "${APPSMITH_REDIS_URL:-}" ]]; then
  echo "FAILED: invalid host was accepted"; fail=$((fail + 1))
elif [[ -n "${APPSMITH_REDIS_URL:-}" ]]; then
  echo "FAILED: invalid host produced a URL"; fail=$((fail + 1))
else
  echo "OK: host containing @ is rejected"
fi
unset APPSMITH_REDIS_HOST

# 16. A remote name that merely contains "localhost" must not get the generated password.
assert_url "hostname containing localhost is treated as remote" \
  "redis://redis-localhost.example.com:6379" \
  APPSMITH_REDIS_PASSWORD=generated APPSMITH_REDIS_URL_EXTERNAL= \
  APPSMITH_REDIS_PASSWORD_EXTERNAL= APPSMITH_REDIS_HOST=redis-localhost.example.com

# 17. redis_url_is_local (embedded Redis selector) matches the URL hostname exactly.
check_url_local() {
  local expected="$1" url="$2" actual=remote
  if redis_url_is_local "$url"; then actual=local; fi
  if [[ "$actual" == "$expected" ]]; then
    echo "OK: $url is $expected"
  else
    echo "FAILED: $url expected $expected, got $actual"
    fail=$((fail + 1))
  fi
}
check_url_local local  "redis://:pw@127.0.0.1:6379"
check_url_local local  "redis://localhost:6379"
check_url_local local  "redis://:pw@[::1]:6379"
check_url_local local  "redis://127.0.0.1"
check_url_local remote "redis://:pw@redis-localhost.example.com:6379"
check_url_local remote "rediss://:pw@127.0.0.1.example.com:6379"
check_url_local remote "redis://[2001:db8::1]:6379"
check_url_local remote "redis://redis.example.com:6379/0"

# 18. The composed URL survives the reload done by run-with-env.sh (docker.env with its
#     localhost default first, then pre-define.json), using the real loader.
# shellcheck source=../fs/opt/appsmith/load-env.sh
source "$script_dir/../fs/opt/appsmith/load-env.sh"
TMP="$(mktemp -d)"
printf '%s\n' 'APPSMITH_REDIS_URL=redis://:generated@127.0.0.1:6379' 'APPSMITH_REDIS_PASSWORD=generated' > "$TMP/docker.env"
printf '%s' '{"APPSMITH_REDIS_HOST": "redis.example.com"}' > "$TMP/pre-define.json"
unset APPSMITH_REDIS_URL APPSMITH_REDIS_PASSWORD REDIS_URL_COMPOSED
export APPSMITH_REDIS_URL_EXTERNAL= APPSMITH_REDIS_PASSWORD_EXTERNAL= APPSMITH_REDIS_HOST=redis.example.com
compose_redis_url_from_parts
persist_composed_redis_url
reloaded="$(
  unset APPSMITH_REDIS_URL
  load_env_file env "$TMP/docker.env"
  load_env_file json "$TMP/pre-define.json"
  printf '%s' "$APPSMITH_REDIS_URL"
)"
if [[ "$reloaded" == "redis://redis.example.com:6379" ]]; then
  echo "OK: composed URL survives the run-with-env.sh reload"
else
  echo "FAILED: composed URL lost on reload (got '$reloaded')"
  fail=$((fail + 1))
fi
rm -rf "$TMP"
unset APPSMITH_REDIS_HOST APPSMITH_REDIS_URL REDIS_URL_COMPOSED

if [[ $fail -eq 0 ]]; then
  echo "SUCCEEDED!!!"
  exit 0
else
  echo "FAILED!!!"
  exit 1
fi
