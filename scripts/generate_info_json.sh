#!/usr/bin/env bash

set -o errexit
set -o nounset

commit_sha="$(git rev-parse HEAD)"

# Base URL of the current repository on GitHub.
base_url="$(git remote get-url origin | sed 's,^git@github\.com:,https://github.com/,; s/\.git$//')"

if [[ $# -gt 0 ]]; then
  input_version="$1"
  if [[ "$input_version" =~ ^v[0-9]+(\.[0-9]+){1,2}$ ]]; then
    version="$input_version"
  else
    echo "Invalid version format. Use v[major].[minor] or v[major].[minor].[patch]." >&2
    exit 1
  fi
elif [[ "${GITHUB_REF-}" =~ ^refs/tags/v ]]; then
  version="${GITHUB_REF#refs/tags/}"
else
  latest_released_version="$(git ls-remote --tags --sort=-v:refname "$(git remote | head -1)" 'v*' | awk -F/ '{print $NF; exit}')"
  echo "latest_released_version = $latest_released_version" >&2
  next_version="$(echo "$latest_released_version" | awk -F. -v OFS=. '{ $2++; $3 = 0; print }')"
  echo "next_version = $next_version" >&2
  version="$next_version-SNAPSHOT"
fi

if [[ -n ${GITHUB_RUN_ID-} ]]; then
  github_run_url="$base_url/actions/runs/$GITHUB_RUN_ID/attempts/${GITHUB_RUN_ATTEMPT-1}"
fi

jq -n \
  --arg commitSha "$commit_sha" \
  --arg commitUrl "$base_url/commit/$commit_sha" \
  --arg githubRef "${GITHUB_REF-}" \
  --arg githubRunUrl "${github_run_url-}" \
  --arg version "$version" \
  --arg imageBuiltAt "$(date -u -Iseconds)" \
  --argjson isCI "${CI:-false}" \
  '$ARGS.named' | tee "$(git rev-parse --show-toplevel)/deploy/docker/fs/opt/appsmith/info.json"

# Usage 
# ./scripts/generate_info_json.sh v0.0.1
# ./scripts/generate_info_json.sh v0.1
# ./scripts/generate_info_json.sh