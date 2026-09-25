#!/usr/bin/env bash

# Make sure docker.env carries a non-empty APPSMITH_MCP_INTERNAL_SECRET before any Appsmith process starts.
#
# The secret is the shared marker between the loopback MCP service and the Java backend: MCP stamps it on every
# /api/v1 call it makes on a user's behalf, and the backend rejects any mcp_ bearer whose marker does not match. Both
# processes read it from docker.env when supervisord starts them, so it has to exist BEFORE they start. Generating it
# here (rather than when an admin flips the MCP toggle) is what lets the toggle apply without a restart, and it means
# every replica that shares this docker.env agrees on the value from its first boot.
#
# Idempotent: an existing non-empty value is never touched, so rotating the secret is an explicit operator action
# (edit docker.env and restart). A missing key, or a key with an empty value (the template ships it empty, and older
# installs wrote one when MCP was disabled), is filled in. The check-and-write runs under an exclusive lock on the
# env file so two replicas booting against one shared volume cannot both generate a value and leave their processes
# disagreeing.
#
# The file is opened for writing only when a write is actually needed, so a read-only docker.env that already holds
# a value is fine. If the filesystem does not support locking at all, the script warns and continues rather than
# stopping the boot: the worst outcome of a lost race is one replica whose processes hold a different value, which
# fails closed (its MCP calls answer 401) until that replica restarts.
#
# A value supplied as a real container environment variable still wins at runtime: run-with-env.sh sources
# docker.env first and the captured container environment second.
#
# Usage: ensure-mcp-internal-secret.sh /path/to/docker.env

set -o errexit
set -o nounset
set -o pipefail

env_path="${1:?usage: ensure-mcp-internal-secret.sh /path/to/docker.env}"
key="APPSMITH_MCP_INTERNAL_SECRET"
lock_wait_seconds=30

if [[ ! -f "$env_path" ]]; then
  echo "ensure-mcp-internal-secret: $env_path does not exist" >&2
  exit 1
fi

generate_secret() {
  # 32 random bytes, URL-safe base64 without padding: the same shape the Java server generates for this value.
  head -c 32 /dev/urandom | base64 | tr '+/' '-_' | tr -d '=\n'
}

current_value() {
  # The last uncommented assignment wins when the file is sourced, so that is the one to inspect.
  local value
  value="$(grep -E "^${key}=" "$env_path" | tail -n 1 | cut -d= -f2- || true)"
  # A trailing " # comment" is not part of the value once sourced.
  value="${value%%[[:space:]]#*}"
  # Strip surrounding whitespace and a matching pair of quotes so a quoted empty value counts as empty.
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  if [[ "$value" == \"*\" || "$value" == \'*\' ]]; then
    value="${value:1:${#value}-2}"
  fi
  printf '%s' "$value"
}

# Lock on a read-only descriptor: flock(2) grants an exclusive lock regardless of the open mode, and this way a
# read-only file that already has a value never needs write access. Concurrent replicas serialise here. A missing
# flock binary or a filesystem without lock support is reported and tolerated rather than stopping the boot.
exec 9<"$env_path"
if command -v flock > /dev/null 2>&1; then
  if ! flock -w "$lock_wait_seconds" 9; then
    echo "ensure-mcp-internal-secret: could not lock ${env_path} (filesystem without lock support, or held for more than ${lock_wait_seconds}s); continuing without the lock" >&2
  fi
else
  echo "ensure-mcp-internal-secret: flock is not available; continuing without the lock" >&2
fi

if [[ -n "$(current_value)" ]]; then
  exit 0
fi

# Nothing to do without write access: the rest of Appsmith must still boot. The backend generates a value itself
# when an admin enables MCP (and logs that the MCP service then needs a restart), so this is degraded, not broken.
if [[ ! -w "$env_path" ]]; then
  echo "ensure-mcp-internal-secret: ${key} is empty but ${env_path} is not writable; MCP will not authenticate until the value is set for both the backend and the MCP service" >&2
  exit 0
fi

secret="$(generate_secret)"

if grep -qE "^${key}=" "$env_path"; then
  # Replace every existing (empty) assignment so the file does not accumulate duplicate keys. The content is
  # written back into the same file rather than renamed over it: the lock above is held on this inode, and an
  # in-place rewrite keeps it valid for any replica still waiting on it, and keeps the file's mode and owner.
  # (Also avoids sed -i, which differs between GNU and BSD.)
  rewritten="$(awk -v key="$key" -v secret="$secret" \
    'index($0, key "=") == 1 { print key "=" secret; next } { print }' "$env_path")"
  printf '%s\n' "$rewritten" > "$env_path"
else
  # Append on its own line; the file may or may not end with a newline.
  if [[ -s "$env_path" && "$(tail -c 1 "$env_path")" != "" ]]; then
    printf '\n' >> "$env_path"
  fi
  printf '%s=%s\n' "$key" "$secret" >> "$env_path"
fi

echo "ensure-mcp-internal-secret: generated ${key} in ${env_path}" >&2
