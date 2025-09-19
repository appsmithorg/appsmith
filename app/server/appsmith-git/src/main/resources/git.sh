#!/usr/bin/env bash

set -euo pipefail

# Simple logging helpers
log_ts() {
    date '+%Y-%m-%dT%H:%M:%S%z'
}

log_info() {
    printf '[%s] [INFO] %s\n' "$(log_ts)" "$*" >&1
}

log_warn() {
    printf '[%s] [WARN] %s\n' "$(log_ts)" "$*" >&1
}

log_error() {
    printf '[%s] [ERROR] %s\n' "$(log_ts)" "$*" >&2
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
    local git_root="$4"

    local temp_private_key=$(mktemp ${git_root}tmp.XXXXXX)
    trap 'rm -rf "'"$temp_private_key"'"' EXIT ERR

    echo "$private_key" > "$temp_private_key"

    git -C "$target_folder" init --initial-branch=none
    git -C "$target_folder" remote add origin "$remote_url"
    GIT_SSH_COMMAND="ssh -i $temp_private_key -o StrictHostKeyChecking=no" git -C "$target_folder" fetch origin
}

git_clean_up() {
    local redis_key="$1"
    local redis_url="$2"
    local target_folder="$3"
    local key_value_pair_key="$4"

    trap 'rm -rf "'"$target_folder"'"' EXIT ERR

    ## delete the repository from redis
    redis-exec "$redis_url" DEL "$redis_key"

    ## delete the repository branch_store
    redis-exec "$redis_url" DEL "$key_value_pair_key"
}

# Uploads git repo to Redis as compressed archive
git_upload() {
    local redis_key="$1"
    local redis_url="$2"
    local target_folder="$3"
    local key_value_pair_key="$4"

    trap 'rm -rf "'"$target_folder"'"' EXIT ERR

    rm -f "$target_folder/.git/index.lock"

    upload_branches_to_redis_hash "$target_folder" "$redis_url" "$key_value_pair_key"
    tar -cf - -C "$target_folder" . | zstd -q --threads=0 | base64 -w 0 | redis-exec "$redis_url" --raw -x SETEX "$redis_key" "$GIT_ARTIFACT_TTL"
}

upload_branches_to_redis_hash() {
    # get all local branches and their latest commit sha
    local directory_path="$1"
    local redis_url="$2"
    local key_value_pair_key="$3"

    local branches=$(git -C "$directory_path" for-each-ref --format='"%(refname:short)" %(objectname:short)' refs/heads/)

    log_info "Preparing to upload branch store. Current branches: $branches"

    redis-exec "$redis_url" DEL "$key_value_pair_key"
    redis-exec "$redis_url" HSET "$key_value_pair_key" $branches
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

    log_info "Searching for repository: $target_folder with key: $redis_key in redis."

    rm -rf "$target_folder"
    mkdir -p "$target_folder"

    if [ "$(redis-exec "$redis_url" --raw EXISTS "$redis_key")" = "1" ]; then
        redis-exec "$redis_url" --raw GET "$redis_key" | base64 -d | zstd -d --threads=0 | tar -xf - -C "$target_folder"
    else
      log_warn "Cache miss. Repository: $target_folder with key: $redis_key does not exist in redis."
      return 1
    fi

    rm -f "$target_folder/.git/index.lock"
    git -C "$target_folder" reset --hard
    git -C "$target_folder" config user.name "$author_name"
    git -C "$target_folder" config user.email "$author_email"
}

git_clone_and_checkout() {
        local author_email="$1"
        local author_name="$2"
        local private_key="$3"
        local remote_url="$4"
        local git_root="$5"
        local target_folder="$6"
        local redis_url="$7"
        local key_value_pair_key="$8"

        ## branches are after argument 8

        trap 'rm -rf "'"$target_folder"'"' ERR

        log_info "target_folder: $target_folder, remote_url: $remote_url"
        ## remove the repository directory entirely
        rm -rf "$target_folder"

        ## create the same directory
        mkdir -p "$target_folder"

        git_clone "$private_key" "$remote_url" "$target_folder" "$git_root"
        git -C "$target_folder" config user.name "$author_name"
        git -C "$target_folder" config user.email "$author_email"
        git -C "$target_folder" config fetch.parallel 4
        git -C "$target_folder" reflog expire --expire=now --all
        git -C "$target_folder" gc --prune=now --aggressive

        # This provides all the arguments from arg 6 onwards to the function git_co_from_redis.
        # This includes the target folder, redis url, key value pair key, and all branch names from db.
        git_checkout_from_branch_store ${@:6}
}

git_checkout_from_branch_store() {
    local repository_path="$1"
    local redis_url="$2"
    local key_value_pair_key="$3"

    # 4th onwards args are branches names from db
    # fetch raw value
    log_info "Searching Redis branch-store for key : $key_value_pair_key"
    local raw
    raw=$(redis-exec "$redis_url" --raw HGETALL "$key_value_pair_key" | sed 's/\"//g')

    # error handling: empty or missing key
    if [[ -z "$raw" ]]; then
        log_warn "No value found for key '$key_value_pair_key'. Initiating checkouts from database branch names"
        git_checkout_all_branches "$repository_path" "${@:4}"
        return 0
    fi

    # Read into an array line by line (handles special chars, no word splitting)
    arr=()
    while IFS= read -r line; do
        arr+=( "$line" )
    done <<< "$raw"

    # Iterate through pairs: arr[0]=branch, arr[1]=sha ...
    local error_return_value=0
    for ((i=0; i<${#arr[@]}; i+=2)); do
        local branch="${arr[i]}"
        local commit="${arr[i+1]}"

        # Skip incomplete pair just in case
        if [[ -z "$branch" || -z "$commit" ]]; then
            continue
        fi

        # call the fallback function
        git_checkout_at_commit "$repository_path" "$branch" "$commit" || {
        log_warn "Git_checkout_at_commit failed for $branch $commit"
        error_return_value=1
        }

    done

    if [[ $error_return_value -eq 1 ]]; then
        log_warn "git_checkout_at_commit failed for some branches. Initiating checkouts from database branch names"
        git_checkout_all_branches "$repository_path" "${@:4}"
        return 0
    fi

    return 0
}

# Function to checkout all local branches in a repository with args from db branch names
git_checkout_all_branches() {
    local target_folder="$1"

    # From arg 2 onwards, all args are local branch names populated from db.
    # Checkout all local branches
    for arg in "${@:2}"; do
        local local_branch=$arg
        log_info "Checking out branch $local_branch from database"
        git -C "$target_folder" checkout $local_branch || log_error "Git checkout failed for $local_branch"
    done
}

# Function to checkout a branch at a specific commit in a specified directory
# If branch exists, it will reset it to the given SHA
# If branch doesn't exist, it will create it at the given SHA
git_checkout_at_commit() {
    # Check if we have exactly 3 arguments
    if [ $# -ne 3 ]; then
        log_info "Usage: git_checkout_at_commit <directory-path> <branch-name> <commit-sha>"
        log_info "Example: git_checkout_at_commit /path/to/repo feature-branch abc123def"
        return 1
    fi

    local directory_path="$1"
    local branch_name="$2"
    local commit_sha="$3"

    # Check if directory exists
    if [ ! -d "$directory_path" ]; then
        log_error "Directory '$directory_path' does not exist"
        return 1
    fi

    # Checkout the branch
    git -C "$directory_path" checkout $branch_name

    # Hard reset to the specified commit
    git -C "$directory_path" reset --hard "$commit_sha"

    log_info "✓ Branch '$branch_name' has been reset to commit $commit_sha in '$directory_path'"
}

git_merge_branch() {
    local target_folder="$1"
    local source_branch="$2"
    local destination_branch="$3"

    git -C "$target_folder" checkout "$destination_branch"
    git -C "$target_folder" merge "$source_branch" --strategy=recursive --allow-unrelated-histories --no-edit
}

# Redis CLI wrapper that handles different URL schemes
# Usage: redis-exec <redis-url> [redis-cli-args...]
# Supports: redis://, rediss://, redis-cluster://
redis-exec() {
    local url="$1"
    
    if [[ -z "$url" ]]; then
        log_error "redis-exec: missing Redis URL"
        log_error "Usage: redis-exec <redis-url> [redis-cli-args...]"
        return 1
    fi
    
    case "$url" in
        redis://*|rediss://*)
            # Standard Redis URL - pass directly to redis-cli -u
            redis-cli -u "$url" "${@:2}"
            ;;
        redis-cluster://*)
            # Cluster URL - extract components and use cluster mode
            local stripped="${url#redis-cluster://}"
            
            # Split into authority and path parts
            local authority="${stripped%%/*}"
            local path_part="${stripped#*/}"
            if [[ "$path_part" == "$stripped" ]]; then
                path_part=""  # No path present
            fi
            
            # Extract credentials from authority (user:pass@host:port)
            local credentials=""
            local host_port="$authority"
            if [[ "$authority" == *"@"* ]]; then
                credentials="${authority%%@*}"
                host_port="${authority##*@}"
            fi
            
            # Parse credentials
            local username=""
            local password=""
            if [[ -n "$credentials" ]]; then
                if [[ "$credentials" == *":"* ]]; then
                    username="${credentials%%:*}"
                    password="${credentials##*:}"
                else
                    password="$credentials"  # Only password provided
                fi
            fi
            
            # Extract host and port
            local host="${host_port%:*}"
            local port="${host_port##*:}"
            
            # If no port specified, default to 6379
            if [[ "$port" == "$host" ]]; then
                port="6379"
            fi
            
            # Extract database number from path
            local database=""
            if [[ -n "$path_part" && "$path_part" =~ ^[0-9]+(\?.*)?$ ]]; then
                database="${path_part%%\?*}"  # Remove query params if present
            fi
            
            # Build redis-cli command
            local cmd_args=("-c" "-h" "$host" "-p" "$port")
            
            # Add authentication if present
            if [[ -n "$username" && -n "$password" ]]; then
                cmd_args+=("--user" "$username" "--pass" "$password")
            elif [[ -n "$password" ]]; then
                cmd_args+=("-a" "$password")
            fi
            
            # Add database selection if specified
            if [[ -n "$database" ]]; then
                cmd_args+=("-n" "$database")
            fi
            
            # Add remaining arguments
            cmd_args+=("${@:2}")
            
            redis-cli "${cmd_args[@]}"
            ;;
        *)
            log_error "redis-exec: unsupported URL scheme: $url"
            log_error "Supported schemes: redis://, rediss://, redis-cluster://"
            return 1
            ;;
    esac
}
