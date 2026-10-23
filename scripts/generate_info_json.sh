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
  # APPSMITH_BUILD_BRANCH is the branch a non-PR build checks out. It is empty for PR builds.
  version="$("$(dirname "$0")/build_version.sh" "${APPSMITH_BUILD_BRANCH-}")"
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

# If running in GitHub Actions, also output the values to GITHUB_OUTPUT
if [[ -n "${GITHUB_OUTPUT-}" ]]; then
  {
    echo "commitSha=$commit_sha"
    echo "repo=$base_url"
    echo "version=$version"
  } >> "$GITHUB_OUTPUT"
fi

# Usage
# ./scripts/generate_info_json.sh v0.0.1
# ./scripts/generate_info_json.sh v0.1
# ./scripts/generate_info_json.sh
