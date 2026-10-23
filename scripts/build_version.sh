#!/usr/bin/env bash

# Prints the version that a build stamps into the jars and into info.json.
#
# Usage: scripts/build_version.sh [branch]
#
# The VERSION file at the repository root holds the version that the next release
# will carry, as major.minor.patch.
#
# - A build from `release` or from a `patch/*` branch prints that version as is,
#   such as 2.6.0. The build fails when a tag for that version is already published.
# - Every other build, including every pull request build, prints a SNAPSHOT
#   version, such as 2.6.0-SNAPSHOT. Pass no branch for a pull request build.

set -o errexit
set -o nounset
set -o pipefail

branch="${1-}"
repo_root="$(git rev-parse --show-toplevel)"
version_file="$repo_root/VERSION"

if [[ ! -f "$version_file" ]]; then
  echo "Missing $version_file." >&2
  exit 1
fi

version="$(tr -d '[:space:]' < "$version_file")"
if ! [[ "$version" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
  echo "VERSION must be major.minor.patch with no prefix, such as 2.6.0. Found '$version'." >&2
  exit 1
fi
major="${BASH_REMATCH[1]}"
minor="${BASH_REMATCH[2]}"
patch="${BASH_REMATCH[3]}"

if [[ "$branch" != "release" && "$branch" != patch/* ]]; then
  echo "$version-SNAPSHOT"
  exit 0
fi

# Tags v2.1 to v2.4 have two parts, so vX.Y also counts as vX.Y.0.
tags=("refs/tags/v$version")
if [[ "$patch" == 0 ]]; then
  tags+=("refs/tags/v$major.$minor")
fi

remote="$(git remote | head -1)"
if ! published="$(timeout 60 git ls-remote --tags "$remote" "${tags[@]}")"; then
  echo "Could not list the tags of remote '$remote' to check whether $version is published." >&2
  exit 1
fi

if [[ -n "$published" ]]; then
  if [[ "$branch" == "release" ]]; then
    fix="Merge a CE pull request that sets VERSION to $major.$((minor + 1)).0. The sync carries it to EE."
  else
    fix="Set VERSION to $major.$minor.$((patch + 1)) on $branch."
  fi
  {
    echo "VERSION is $version, but this version is already published:"
    echo "$published"
    echo "$fix"
  } >&2
  exit 1
fi

echo "$version"
