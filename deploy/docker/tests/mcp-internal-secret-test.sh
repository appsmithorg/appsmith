#!/usr/bin/env bash

# Unit tests for the boot-time MCP internal secret:
#   - deploy/docker/fs/opt/appsmith/templates/docker.env.sh ships APPSMITH_MCP_INTERNAL_SECRET for a fresh install
#   - deploy/docker/fs/opt/appsmith/ensure-mcp-internal-secret.sh backfills an existing docker.env exactly once
#
# Both run without a container. The secret has to exist before the backend and the MCP service start, because both
# read it from docker.env at program start; that is what lets an admin enable MCP without a restart.

set -o errexit
set -o nounset
set -o pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
template="$script_dir/../fs/opt/appsmith/templates/docker.env.sh"
ensure="$script_dir/../fs/opt/appsmith/ensure-mcp-internal-secret.sh"
key="APPSMITH_MCP_INTERNAL_SECRET"

fail=0
ok() { echo "OK: $1"; }
bad() { echo "FAILED: $1"; fail=$((fail + 1)); }

# The value shape the entrypoint and the Java server both produce: 32 bytes as URL-safe base64, no padding.
value_re='^[A-Za-z0-9_-]{43}$'

value_of() {
  # Last uncommented assignment wins when the file is sourced.
  grep -E "^${key}=" "$1" | tail -n 1 | cut -d= -f2- || true
}

count_of() {
  grep -cE "^${key}=" "$1" || true
}

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# --- fresh install: the template ships the key empty and the first boot fills it in ------------------------------
# The template deliberately takes no extra positional argument for this value (EE's copy of the template already
# uses the next slot), so a fresh docker.env is completed by the same backfill that upgrades run.

env0="$work/fresh.env"
# Positional args match entrypoint.sh's init_env_file() invocation: mongo user, mongo pw, encryption pw,
# encryption salt, redis pw. A sixth dummy value is passed so the same test renders the EE template, which takes one
# more argument; the CE template ignores it.
bash "$template" appsmith dbpw encpw encsalt redispw temporalpw > "$env0"
if grep -qE "^${key}=$" "$env0"; then
  ok "docker.env.sh ships ${key} empty for the entrypoint to fill in"
else
  bad "docker.env.sh does not ship an empty ${key} assignment"
fi
bash "$ensure" "$env0" 2> /dev/null
v="$(value_of "$env0")"
if [[ "$v" =~ $value_re && "$(count_of "$env0")" == "1" ]]; then
  ok "a fresh docker.env ends up with exactly one 43-character value after the first boot"
else
  bad "fresh docker.env was not completed correctly (value '${v}', count $(count_of "$env0"))"
fi

# --- ensure script: missing key is appended ---------------------------------------------------------------------

env1="$work/missing.env"
printf 'APPSMITH_REDIS_URL=redis://127.0.0.1:6379\nAPPSMITH_ENCRYPTION_SALT=salt' > "$env1"   # no trailing newline
bash "$ensure" "$env1" 2> /dev/null
v="$(value_of "$env1")"
if [[ "$v" =~ $value_re ]]; then
  ok "missing key is appended with a 43-character URL-safe value"
else
  bad "missing key was not appended correctly (got '${v}')"
fi
if grep -qE '^APPSMITH_ENCRYPTION_SALT=salt$' "$env1"; then
  ok "appending after a file with no trailing newline keeps the previous line intact"
else
  bad "the previous last line was damaged when appending"
fi

# --- ensure script: an empty value (older installs wrote one on disable) is filled in place ----------------------

env2="$work/empty.env"
printf 'A=1\n%s=\nB=2\n' "$key" > "$env2"
bash "$ensure" "$env2" 2> /dev/null
v="$(value_of "$env2")"
if [[ "$v" =~ $value_re && "$(count_of "$env2")" == "1" ]]; then
  ok "empty value is replaced in place without adding a duplicate key"
else
  bad "empty value was not replaced in place (value '${v}', count $(count_of "$env2"))"
fi

# --- ensure script: a quoted empty value counts as empty ---------------------------------------------------------

env3="$work/quoted.env"
printf '%s=""\n' "$key" > "$env3"
bash "$ensure" "$env3" 2> /dev/null
v="$(value_of "$env3")"
if [[ "$v" =~ $value_re ]]; then
  ok "quoted empty value is treated as empty and replaced"
else
  bad "quoted empty value was left in place (got '${v}')"
fi

# --- ensure script: a value followed by a trailing comment is a real value; an empty one before a comment is not --

env3b="$work/comment.env"
printf '%s=keep-me # marker\n' "$key" > "$env3b"
bash "$ensure" "$env3b" 2> /dev/null
if grep -qE "^${key}=keep-me # marker$" "$env3b"; then
  ok "a value with a trailing comment is left untouched"
else
  bad "a value with a trailing comment was changed (now '$(value_of "$env3b")')"
fi

env3c="$work/empty-comment.env"
printf '%s= # filled at first boot\n' "$key" > "$env3c"
bash "$ensure" "$env3c" 2> /dev/null
v="$(value_of "$env3c")"
if [[ "$v" =~ $value_re ]]; then
  ok "an empty value followed by a comment is treated as empty and replaced"
else
  bad "an empty value followed by a comment was left in place (got '${v}')"
fi

# --- ensure script: a read-only file that already has a value needs no write access ------------------------------
# Boot must not fail on a read-only docker.env when there is nothing to write.

env3d="$work/readonly.env"
printf '%s=keep-me\n' "$key" > "$env3d"
chmod 444 "$env3d"
if bash "$ensure" "$env3d" 2> /dev/null && [[ "$(value_of "$env3d")" == "keep-me" ]]; then
  ok "a read-only file with a value present exits 0 without touching it"
else
  bad "a read-only file with a value present failed or was changed"
fi
chmod 644 "$env3d"

# A read-only file with NO value cannot be fixed here, but it must not stop the boot either: warn and exit 0.
env3e="$work/readonly-empty.env"
printf '%s=\n' "$key" > "$env3e"
chmod 444 "$env3e"
if bash "$ensure" "$env3e" 2> "$work/readonly-empty.err" && grep -q "not writable" "$work/readonly-empty.err"; then
  ok "a read-only file with an empty value warns and exits 0 instead of aborting the boot"
else
  bad "a read-only file with an empty value did not warn-and-continue (exit $?)"
fi
chmod 644 "$env3e"

# --- ensure script: an existing value is never touched, and a second run changes nothing -------------------------

env4="$work/existing.env"
printf '%s=keep-me\n' "$key" > "$env4"
bash "$ensure" "$env4" 2> /dev/null
if [[ "$(value_of "$env4")" == "keep-me" ]]; then
  ok "existing value is left untouched"
else
  bad "existing value was overwritten (got '$(value_of "$env4")')"
fi

before="$(cat "$env1")"
bash "$ensure" "$env1" 2> /dev/null
if [[ "$(cat "$env1")" == "$before" ]]; then
  ok "a second run on a filled file is a no-op"
else
  bad "a second run changed a filled file"
fi

# --- ensure script: two values on the same volume never diverge --------------------------------------------------
# Run the script concurrently against one file, as two replicas booting against a shared volume would.

env5="$work/shared.env"
printf 'A=1\n' > "$env5"
bash "$ensure" "$env5" 2> /dev/null &
bash "$ensure" "$env5" 2> /dev/null &
bash "$ensure" "$env5" 2> /dev/null &
wait
if [[ "$(count_of "$env5")" == "1" && "$(value_of "$env5")" =~ $value_re ]]; then
  ok "concurrent runs against one file produce exactly one value"
else
  bad "concurrent runs produced $(count_of "$env5") assignments"
fi

# --- ensure script: a missing file is an error, not a silent no-op ----------------------------------------------

if bash "$ensure" "$work/does-not-exist.env" 2> /dev/null; then
  bad "a missing env file was silently accepted"
else
  ok "a missing env file is reported as an error"
fi

if [[ $fail -eq 0 ]]; then
  echo "SUCCEEDED!!!"
  exit 0
else
  echo "FAILED!!!"
  exit 1
fi
