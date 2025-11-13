#!/usr/bin/env bash

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

upload_branches_to_redis_hash() {
    # get all local branches and their latest commit sha
    local directory_path="$1"
    local redis_url="$2"
    local key_value_pair_key="$3"

    local failure=0
    local branches=$(git -C "$directory_path" for-each-ref --format='"%(refname:short)" %(objectname:short)' refs/heads/) || failure=1

    if [[ $failure -eq 1 ]]; then
        log_error "Failed to get branches for repository: $directory_path"
        return 1
    fi

    log_info "Preparing to upload branch store. Current branches: $branches"
    redis-exec "$redis_url" DEL "$key_value_pair_key"
    redis-exec "$redis_url" HSET "$key_value_pair_key" $branches
}

# Finds git repositories under a given directory (up to 4 levels deep)
# Usage: find_git_repos <directory>
# - cd's into the directory
# - finds all ".git" folders up to 4 levels deep
# - collects their repository roots into an array
# - prints each repository root, one per line
find_git_repos() {
    local search_dir="$1"
    local redis_url="$2"
    local max_depth=4

    if [[ $# -eq 3 ]]; then
        log_info "Max depth provided: $3"
        max_depth="$3"
    fi

    if [[ -z "${search_dir:-}" ]]; then
        log_warn "Usage: find_git_repos <directory>"
        return 1
    fi

    if [[ ! -d "$search_dir" ]]; then
        log_warn "Directory '$search_dir' does not exist"
        return 1
    fi

    (
        cd "$search_dir"
        local found_any_repo=false

        # Find .git directories up to depth 4 and process each one immediately
        while IFS= read -r gitdir; do
            # Strip the trailing '/.git' and leading './'
            local base_root="${gitdir%/.git}"
            base_root="${base_root#./}"
            
            # Process this repository immediately
            local key_value_pair_key="branchStore=${base_root}"
            log_info "Upload sequence for repository : ${base_root}"
            upload_branches_to_redis_hash "$base_root" "$redis_url" "$key_value_pair_key"
            
            found_any_repo=true
        done < <(find . -maxdepth $max_depth -type d -name .git 2>/dev/null)

        if [[ "$found_any_repo" == false ]]; then
            log_warn "No git repositories found under '$search_dir' (max depth $max_depth)"
            return 0
        fi
    )
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
