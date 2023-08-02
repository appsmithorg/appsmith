#!/usr/bin/env bash

set -o errexit
set -o nounset

commit_sha="$(git rev-parse HEAD)"

# Base URL of the current repository on GitHub.
base_url="$(git remote get-url origin | sed 's,^git@github\.com:,https://github.com/,; s/\.git$//')"

# Tag, if any, on the HEAD commit.
git_tag="$(git describe --exact-match --tags --match 'v*' --dirty --broken || echo)"

jq -n \
  --arg commitSha "$commit_sha" \
  --arg commitUrl "$base_url/commit/$commit_sha" \
  --arg gitTag "$git_tag" \
  --arg branch "$(git rev-parse --abbrev-ref HEAD)" \
  --arg date "$(date -u -Iseconds)" \
  --argjson isCI "${CI:-false}" \
  '$ARGS.named' | tee "$(git rev-parse --show-toplevel)/info.json"
