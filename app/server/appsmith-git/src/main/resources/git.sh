#!/usr/bin/env bash

set -euo pipefail

# Simple logging helpers
log_ts() {
    date '+%Y-%m-%dT%H:%M:%S%z'
}

log_info() {
    printf '%s [INFO] %s\n' "$(log_ts)" "$*" >&2
}

log_warn() {
    printf '%s [WARN] %s\n' "$(log_ts)" "$*" >&2
}

log_error() {
    printf '%s [ERROR] %s\n' "$(log_ts)" "$*" >&2
}

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

    echo "Looking for repository: $target_folder with key: $redis_key in redis." >&1

    rm -rf "$target_folder"
    mkdir -p "$target_folder"

    if [ "$(redis-cli -u "$redis_url" --raw EXISTS "$redis_key")" = "1" ]; then
        redis-cli -u "$redis_url" --raw GET "$redis_key" | base64 -d | zstd -d --threads=0 | tar -xf - -C "$target_folder"
    else
      echo "Cache miss -> repository: $target_folder with key: $redis_key does not exist redis." >&1
      return 1
    fi

    rm -f "$target_folder/.git/index.lock"
    git -C "$target_folder" reset --hard
}

git_clone_and_checkout() {
    local author_email="$1"
    local author_name="$2"
    local private_key="$3"
    local remote_url="$4"
    local target_folder="$5"
    ## branches are after argument 5

    trap 'log_error "git_clone_and_checkout failed; cleaning up: '$target_folder'"; rm -rf "'$target_folder'"' ERR

    log_info "git_clone_and_checkout: target_folder='${target_folder}', remote_url='${remote_url}'"
    ## remove the repository directory entirely
    rm -rf "$target_folder"

    ## create the same directory
    mkdir -p "$target_folder"

    git_clone "$private_key" "$remote_url" "$target_folder"
    git -C "$target_folder" config user.name "$author_name"
    git -C "$target_folder" config user.email "$author_email"
    git -C "$target_folder" config fetch.parallel 4

    # Checkout requested branches (args 6..N)
    for arg in "${@:6}"; do
        local local_branch
        local_branch="$arg"
        if [ -z "${local_branch}" ]; then
            log_warn "git_clone_and_checkout: empty branch argument encountered; skipping"
            continue
        fi
        log_info "git_clone_and_checkout: checking out branch '${local_branch}'"

        # If branch exists locally
        if git -C "$target_folder" show-ref --verify --quiet "refs/heads/${local_branch}"; then
            git -C "$target_folder" checkout "${local_branch}"
            continue
        fi

        # If remote branch exists
        if git -C "$target_folder" ls-remote --heads origin "${local_branch}" >/dev/null 2>&1; then
            git -C "$target_folder" checkout -b "${local_branch}" "origin/${local_branch}"
            continue
        fi

        # Fallback: attempt to fetch/track remote if possible; else warn
        if git -C "$target_folder" fetch origin "${local_branch}:${local_branch}" >/dev/null 2>&1; then
            git -C "$target_folder" checkout "${local_branch}"
        else
            log_warn "git_clone_and_checkout: branch '${local_branch}' not found locally or on origin; skipping"
        fi
    done

}

# Downloads git repo from Redis or clones if not cached
git_download_old() {
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
