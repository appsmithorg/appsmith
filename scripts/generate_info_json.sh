#!/usr/bin/env bash

set -o errexit
set -o nounset

commit_sha="$(git rev-parse HEAD)"

# Base URL of the current repository on GitHub.
base_url="$(git remote get-url origin | sed 's,^git@github\.com:,https://github.com/,; s/\.git$//')"

git_ref="${GITHUB_HEAD_REF-}"
if [[ -z "$git_ref" ]]; then
  # If the GITHUB_HEAD_REF environment variable is not set, then we are not running in a GitHub Actions workflow.
  # In that case, we will use the current branch name as the git ref.
  git_ref="$(git symbolic-ref HEAD || echo)"
fi

# Tag, if any, on the HEAD commit.
# Output of this `describe` command is described at https://git-scm.com/docs/git-describe#_examples.
git_tag="$(
  # If HEAD is a commit in the `master` branch, then `git describe --tags` will give a relevant tag name.
  if git merge-base --is-ancestor HEAD origin/master; then
    git describe --tags --match 'v*' --dirty --broken | sed 's/-g.*$//'
  fi
  # This will look like `v1.9.30` when HEAD is the tag `v1.9.30`, or something like `v1.9.30-10` when HEAD is 10 commits
  # ahead of the tag `v1.9.30`.
)"

if [[ -n ${GITHUB_RUN_ID-} ]]; then
  github_run_url="$base_url/actions/runs/$GITHUB_RUN_ID/attempts/${GITHUB_RUN_ATTEMPT-1}"
fi

jq -n \
  --arg commitSha "$commit_sha" \
  --arg commitUrl "$base_url/commit/$commit_sha" \
  --arg gitRef "$git_ref" \
  --arg githubRef "${GITHUB_REF-}" \
  --arg gitNearestTag "$git_tag" \
  --arg githubRunUrl "${github_run_url-}" \
  --arg imageBuiltAt "$(date -u -Iseconds)" \
  --argjson isCI "${CI:-false}" \
  '$ARGS.named' | tee "$(git rev-parse --show-toplevel)/info.json"
