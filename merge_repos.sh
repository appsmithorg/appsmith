#!/bin/bash

# This script takes a remote repository and merges it into
# the current one as a subdirectory

set -e

if [ -z "$1" ]
then
    echo "Usage:"
    echo "    ./merge_repos.sh <repository> [name]"
    echo "        <repository> remote repository to merge"
    echo "        [name]       sub-directory name (optional)"
    exit
fi

REPO_REMOTE="$1"
REPO_NAME="$2"

# infer a name if one is not provided
if [ -z "$REPO_NAME" ]
then
    REPO_NAME="${REPO_REMOTE##*/}"
    REPO_NAME="${REPO_NAME%.*}"
fi

REPO_DIR_TMP=${REPO_NAME}

mkdir -p /tmp/${REPO_DIR_TMP}

# REPO_DIR_TMP="$(mktemp -d -t "${TMPDIR:-/tmp}${REPO_NAME}.XXXX")"

echo "REPO REMOTE: $REPO_REMOTE"
echo "REPO NAME: $REPO_NAME"
echo "REPO TMP DIR: $REPO_DIR_TMP"
echo
read -p "Press <Enter> to continue"

# clone other repo
git clone "$REPO_REMOTE" "$REPO_DIR_TMP"

# rewrite the entire history into sub-directory
export REPO_NAME
(
    cd $REPO_DIR_TMP &&
    git filter-branch -f --prune-empty --tree-filter '
        mkdir -p "${REPO_NAME}_tmp"
        git ls-tree --name-only $GIT_COMMIT | xargs -I{} mv {} "${REPO_NAME}_tmp"
        mv "${REPO_NAME}_tmp" "$REPO_NAME"
    '
)

# merge the rewritten repo
git remote add "$REPO_NAME" "$REPO_DIR_TMP"
git fetch "$REPO_NAME"
# if you're running an older version of git, remove --allow-unrelated-histories
git checkout -b release
git merge --allow-unrelated-histories "$REPO_NAME/release"

# delete the rewritten repo
rm -rf "$REPO_DIR_TMP"
git remote rm "$REPO_NAME"
