#!/usr/bin/env bash

# Unit test for the generated docker.env defaults produced by
# deploy/docker/fs/opt/appsmith/templates/docker.env.sh.
#
# docker.env.sh renders the default docker.env only on FIRST install (see
# init_env_file() in deploy/docker/fs/opt/appsmith/entrypoint.sh). This test
# renders the template directly (no container needed) and asserts the shipped
# frame-ancestors default is safe: it must not ship a permissive wildcard, so
# that a fresh install falls through to the "'self'" default applied by
# caddy-reconfigure.mjs. Guards APP-15353 (clickjacking hardening).

set -o errexit
set -o nounset
set -o pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
template="$script_dir/../fs/opt/appsmith/templates/docker.env.sh"

if [[ ! -e "$template" ]]; then
  echo "FAILED: template not found at $template"
  exit 1
fi

# Render with dummy positional args matching entrypoint.sh's init_env_file() invocation:
# mongo user, mongo pw, encryption pw, encryption salt, redis pw.
rendered="$(bash "$template" appsmith dbpw encpw encsalt redispw)"

fail=0

# The rendered env must not set an uncommented APPSMITH_ALLOWED_FRAME_ANCESTORS that permits any origin.
# A leading "#" (optionally indented) means the line is commented out and therefore not shipped as a value.
permissive="$(printf '%s\n' "$rendered" \
  | grep -E '^[[:space:]]*APPSMITH_ALLOWED_FRAME_ANCESTORS=' \
  | grep -F '*' || true)"

if [[ -n "$permissive" ]]; then
  echo "FAILED: docker.env.sh ships a permissive wildcard frame-ancestors default:"
  echo "  $permissive"
  fail=$((fail + 1))
else
  echo "OK: no permissive wildcard frame-ancestors default is shipped"
fi

# There must be no uncommented assignment at all, so the runtime default ("'self'") applies.
active="$(printf '%s\n' "$rendered" \
  | grep -E '^[[:space:]]*APPSMITH_ALLOWED_FRAME_ANCESTORS=' || true)"

if [[ -n "$active" ]]; then
  echo "FAILED: docker.env.sh sets APPSMITH_ALLOWED_FRAME_ANCESTORS; it should be commented out so the safe 'self' runtime default applies:"
  echo "  $active"
  fail=$((fail + 1))
else
  echo "OK: APPSMITH_ALLOWED_FRAME_ANCESTORS is not set, runtime default 'self' applies"
fi

if [[ $fail -eq 0 ]]; then
  echo "SUCCEEDED!!!"
  exit 0
else
  echo "FAILED!!!"
  exit 1
fi
