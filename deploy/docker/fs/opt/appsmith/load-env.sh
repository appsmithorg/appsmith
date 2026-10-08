#!/usr/bin/env bash

# Parse completely before exporting anything. A failed parser must never launch
# a service with a partially loaded configuration.
load_env_file() {
  local env_loader_output env_loader_assignment
  local env_loader_status=0
  env_loader_output=$(mktemp) || return 1
  if ! /usr/bin/python3 "$(dirname "${BASH_SOURCE[0]}")/env-file.py" "$1" "$2" > "$env_loader_output"; then
    printf 'Configuration file could not be loaded: %s\n' "$2" >&2
    rm -f "$env_loader_output"
    return 1
  fi
  while IFS= read -r -d '' env_loader_assignment; do
    export "${env_loader_assignment?}" || { env_loader_status=1; break; }
  done < "$env_loader_output"
  rm -f "$env_loader_output" || return 1
  return "$env_loader_status"
}
