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
GIT_ARTIFACT_TTL=1800

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
    GIT_SSH_COMMAND="ssh -i $temp_private_key -o StrictHostKeyChecking=no" git -C "$target_folder" fetch origin
}

# Uploads git repo to Redis as compressed archive
git_upload() {
    local redis_key="$1"
    local redis_url="$2"
    local target_folder="$3"
    local key_value_pair_key="$4"

    trap 'rm -rf "'"$target_folder"'"' EXIT ERR

    rm -f "$target_folder/.git/index.lock"

    local branches=$(branches_to_json "$target_folder")

    echo "In the upload process storing key: {$key_value_pair_key} with value: $branches"
    redis-cli -u "$redis_url" SET "$key_value_pair_key" "$branches"
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
    local key_value_pair_key="$8"

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
        local redis_url="$6"
        local key_value_pair_key="$7"

        ## branches are after argument 7

        trap 'rm -rf "'"$target_folder"'"' ERR

        echo "target_folder: $target_folder, remote_url: $remote_url" >&1
        ## remove the repository directory entirely
        rm -rf "$target_folder"

        ## create the same directory
        mkdir -p "$target_folder"

        echo "Searching in clone_and_checkout key: $key_value_pair_key" >&1

        git_clone "$private_key" "$remote_url" "$target_folder"
        git -C "$target_folder" config user.name "$author_name"
        git -C "$target_folder" config user.email "$author_email"
        git -C "$target_folder" config fetch.parallel 4


        # This provides all the arguments from arg 5 onwards to the function git_co_from_redis.
        # This includes the target folder, redis url, key value pair key, and all branch names from db.
        git_co_from_redis ${@:5}

        # "$target_folder" "$redis_url" "$key_value_pair_key"
}

# Function to checkout all local branches in a repository with args from db branch names
git_checkout_all_branches() {
    local target_folder="$1"

    # From arg 2 onwards, all args are local branch names populated from db.
    # Checkout all local branches
    for arg in "${@:2}"; do
        local local_branch=$arg
        echo "checking out local_branch $local_branch" >&1
        git -C "$target_folder" checkout $local_branch
    done
}

git_co_from_redis() {
    local repository_path="$1"
    local redis_url="$2"
    local key_value_pair_key="$3"

    # 4th onwards args are branches names from db

    # fetch raw value
    local raw
    raw=$(redis-cli -u "$redis_url" get "$key_value_pair_key")

    # error handling: empty or missing key
    if [[ -z "$raw" ]]; then
        echo "Error: no value found for key '$key_value_pair_key'. Initiating checkouts from database branch names" >&2
        git_checkout_all_branches "$repository_path" "${@:4}"
        return 0
    fi

    # strip { }, quotes, and spaces
    local clean
    clean=$(echo "$raw" | sed -E 's/^\{|\}$|"//g;  s/ //g')

    # error handling: ensure cleaned string isn't empty
    if [[ -z "$clean" ]]; then
        echo "Error: failed to parse value from Redis. Initiating checkouts from database branch names" >&2
        git_checkout_all_branches "$repository_path" "${@:4}"
        return 0
    fi

    # tokenize on comma
    IFS=',' read -ra tokens <<< "$clean"
    local error_return_value=0
    for token in "${tokens[@]}"; do
        # split branch:commit
        IFS=':' read -ra kv <<< "$token"
        local branch="${kv[0]}"
        local commit="${kv[1]}"

        if [[ -z "$branch" || -z "$commit" ]]; then
            echo "Warning: invalid token '$token' (skipping)" >&2
            continue
        fi

        # call the other function
        git_checkout_at_commit "$repository_path" "$branch" "$commit" || {
        echo "Error: git_checkout_at_commit failed for $branch $commit" >&2
        error_return_value=1
        }
    done

    if [[ $error_return_value -eq 1 ]]; then
        echo "Error: git_checkout_at_commit failed for some branches. Initiating checkouts from database branch names" >&2
        git_checkout_all_branches "$repository_path" "${@:4}"
        return 0
    fi

    return 0
}

# Function to checkout a branch at a specific commit in a specified directory
# If branch exists, it will reset it to the given SHA
# If branch doesn't exist, it will create it at the given SHA
git_checkout_at_commit() {
    # Check if we have exactly 3 arguments
    if [ $# -ne 3 ]; then
        echo "Usage: git_checkout_at_commit <directory-path> <branch-name> <commit-sha>"
        echo "Example: git_checkout_at_commit /path/to/repo feature-branch abc123def"
        return 1
    fi

    local directory_path="$1"
    local branch_name="$2"
    local commit_sha="$3"

    # Check if directory exists
    if [ ! -d "$directory_path" ]; then
        echo "Error: Directory '$directory_path' does not exist"
        return 1
    fi

    ## TODO: remove this block, 100% asserted already
    # Check if the directory is a git repository
    if ! git -C "$directory_path" rev-parse --git-dir > /dev/null 2>&1; then
        echo "Error: '$directory_path' is not a git repository"
        return 1
    fi

    # Verify the commit SHA exists in the target repository
    if ! git -C "$directory_path" rev-parse --verify "$commit_sha^{commit}" > /dev/null 2>&1; then
        echo "Error: Commit '$commit_sha' does not exist in repository at '$directory_path'"
        return 1
    fi

    # Get the full SHA for better accuracy (in case a short SHA was provided)
    local full_sha=$(git -C "$directory_path" rev-parse "$commit_sha")

    # Check if the branch already exists (locally)
    # if git -C "$directory_path" show-ref --verify --quiet "refs/heads/$branch_name"; then
        # echo "Branch '$branch_name' already exists locally in '$directory_path'. Resetting to $full_sha..."

        # Checkout the branch
        git -C "$directory_path" checkout "$branch_name"

        # Hard reset to the specified commit
        git -C "$directory_path" reset --hard "$full_sha"

        echo "✓ Branch '$branch_name' has been reset to commit $full_sha in '$directory_path'"
    # else
    #     echo "Branch '$branch_name' does not exist in '$directory_path'. Creating new branch at $full_sha..."

    #     # Create and checkout new branch at the specified commit
    #     git -C "$directory_path" checkout -b "$branch_name" "$full_sha"

    #     echo "✓ New branch '$branch_name' created at commit $full_sha in '$directory_path'"
    # fi
}

branches_to_json() {
  # get all local branches and their latest commit sha
  local directory_path="$1"
  git -C $directory_path for-each-ref --format='%(refname:short):%(objectname:short)' refs/heads/ \ | awk -F':' '
    BEGIN {
      printf("{")
    }
    {
      if (count > 0) {
        printf(",")
      }
      printf("\"%s\":\"%s\"", $1, $2)
      count++
    }
    END {
      printf("}\n")
    }
  '
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
