#!/usr/bin/env bash

set -euo pipefail

# Time-to-live for git artifacts in Redis (24 hours in seconds)
GIT_ARTIFACT_TTL=86400

# Returns Redis lock key for given key
get_lock_key() {
    local redis_key="$1"

    echo "lock:${redis_key}"
}

# Clones git repo using SSH key
git_clone() {
    local private_key="$1"
    local remote_url="$2"
    local target_folder="$3"

    local temp_private_key=$(mktemp /dev/shm/tmp.XXXXXX)
    trap 'rm -rf "'"$temp_private_key"'"' EXIT ERR

    echo "$private_key" > "$temp_private_key"

    git -C "$target_folder" init "$target_folder" --initial-branch=none
    git -C "$target_folder" remote add origin "$remote_url"
    GIT_SSH_COMMAND="ssh -i $temp_private_key -o StrictHostKeyChecking=no" git -C "$target_folder" fetch origin --depth=1
}

# Uploads git repo to Redis as compressed archive
git_upload() {
    local redis_key="$1"
    local redis_url="$2"
    local target_folder="$3"

    trap 'rm -rf "'"$target_folder"'"' EXIT ERR

    rm -f "$target_folder/.git/index.lock"

    tar -cf - -C "$target_folder" . | zstd -q --threads=0 | base64 -w 0 | redis-cli -u "$redis_url" --raw -x SETEX "$redis_key" "$GIT_ARTIFACT_TTL"
}

# Downloads git repo from Redis or clones if not cached
git_download() {
    local author_email="$1"
    local author_name="$2"
    local private_key="$3"
    local redis_key="$4"
    local redis_url="$5"
    local remote_url="$6"
    local target_folder="$7"

    rm -rf "$target_folder"
    mkdir -p "$target_folder"

    if [ "$(redis-cli -u "$redis_url" --raw EXISTS "$redis_key")" = "1" ]; then
        redis-cli -u "$redis_url" --raw GET "$redis_key" | base64 -d | zstd -d --threads=0 | tar -xf - -C "$target_folder"
    else
        git_clone "$private_key" "$remote_url" "$target_folder"
    fi

    rm -f "$target_folder/.git/index.lock"

    git -C "$target_folder" config user.name "$author_name"
    git -C "$target_folder" config user.email "$author_email"
    git -C "$target_folder" config fetch.parallel 4

    git -C "$target_folder" reset --hard

    # Checkout all branches
    for remote in $(git -C "$target_folder" branch -r | grep -vE 'origin/HEAD'); do
        branch=${remote#origin/}
        if ! git -C "$target_folder" show-ref --quiet "refs/heads/$branch"; then
            git -C "$target_folder" checkout -b "$branch" "$remote" || true
        fi
    done
}

git_merge_branch() {
    local target_folder="$1"
    local source_branch="$2"
    local destination_branch="$3"

    git -C "$target_folder" checkout "$destination_branch"
    git -C "$target_folder" merge "$source_branch" --strategy=recursive --allow-unrelated-histories --no-edit
}
