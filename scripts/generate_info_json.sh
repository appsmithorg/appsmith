#!/usr/bin/env bash

set -o errexit
set -o nounset

commit_sha="$(git rev-parse HEAD)"

# Base URL of the current repository on GitHub.
base_url="$(git remote get-url origin | sed 's,^git@github\.com:,https://github.com/,; s/\.git$//')"

git_branch="$(git rev-parse --abbrev-ref HEAD)"

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

jq -n \
  --arg commitSha "$commit_sha" \
  --arg commitUrl "$base_url/commit/$commit_sha" \
  --arg branch "$git_branch" \
  --arg gitTag "$git_tag" \
  --arg date "$(date -u -Iseconds)" \
  --argjson isCI "${CI:-false}" \
  '$ARGS.named' | tee "$(git rev-parse --show-toplevel)/info.json"
