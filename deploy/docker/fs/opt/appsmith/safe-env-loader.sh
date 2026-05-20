#!/usr/bin/env bash
# safe-env-loader.sh — Defense-in-depth for GHSA-h6hh-wqxc-5hw9
#
# Provides safe_source_env() as a drop-in replacement for `. "$ENV_PATH"`.
# Parses KEY=VALUE lines with shell quoting (single/double quotes) WITHOUT
# evaluating command substitution, backticks, or any other shell constructs.
#
# Also provides validate_env_file() and sanitize_env_file() for startup-time
# detection and remediation of poisoned env files from previously exploited
# instances.

# Pattern matching shell metacharacters that indicate command injection
# when found outside of single quotes in an env value.
readonly _DANGEROUS_UNQUOTED_PATTERN='(\$\(|`|\$\(\(|\$\{[A-Za-z_])'

# safe_source_env — Parse a KEY=VALUE env file and export variables without
# using Bash `source`/`.`. Handles single-quote, double-quote, and the
# escapeForShell '"'"' pattern. Never evaluates $(), backticks, or ${}.
#
# Usage: safe_source_env /path/to/env-file
safe_source_env() {
  local env_file="$1"
  [[ -f "$env_file" ]] || return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip blank lines and comments
    [[ "$line" =~ ^[[:space:]]*($|#) ]] && continue

    # Split on first '='
    local key="${line%%=*}"
    local raw_value="${line#*=}"

    # If no '=' was found, key == line; skip
    [[ "$key" == "$line" ]] && continue

    # Validate key is a legal env var name
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue

    # Parse the value: handle shell quoting character by character
    local value=""
    local i=0
    local len=${#raw_value}

    while (( i < len )); do
      local ch="${raw_value:i:1}"
      case "$ch" in
        "'")
          # Single-quoted segment: everything until next ' is literal
          (( i++ ))
          while (( i < len )); do
            ch="${raw_value:i:1}"
            if [[ "$ch" == "'" ]]; then
              (( i++ ))
              break
            fi
            value+="$ch"
            (( i++ ))
          done
          ;;
        '"')
          # Double-quoted segment: literal except for \" escape
          (( i++ ))
          while (( i < len )); do
            ch="${raw_value:i:1}"
            if [[ "$ch" == '"' ]]; then
              (( i++ ))
              break
            fi
            if [[ "$ch" == '\' ]] && (( i + 1 < len )); then
              local next="${raw_value:i+1:1}"
              if [[ "$next" == '"' || "$next" == '\' ]]; then
                value+="$next"
                (( i += 2 ))
                continue
              fi
            fi
            value+="$ch"
            (( i++ ))
          done
          ;;
        *)
          # Unquoted: take the character literally (no expansion)
          value+="$ch"
          (( i++ ))
          ;;
      esac
    done

    export "$key=$value"
  done < "$env_file"
}

# validate_env_file — Scan an env file for dangerous shell metacharacters
# in unquoted value contexts. Returns 0 if safe, 1 if dangerous patterns found.
#
# Usage: validate_env_file /path/to/env-file
validate_env_file() {
  local env_file="$1"
  local found_dangerous=0

  [[ -f "$env_file" ]] || return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*($|#) ]] && continue

    local key="${line%%=*}"
    local raw_value="${line#*=}"
    [[ "$key" == "$line" ]] && continue
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue

    # If the value starts with a single quote, it's properly escaped by
    # escapeForShell — single-quoted strings are safe in Bash.
    [[ "$raw_value" == "'"* ]] && continue

    # Check the raw (unquoted) value for dangerous patterns
    if [[ "$raw_value" =~ $'\x60' ]] || [[ "$raw_value" =~ '$(' ]]; then
      echo "SECURITY WARNING: Dangerous shell metacharacters in $key" >&2
      found_dangerous=1
    fi
  done < "$env_file"

  return "$found_dangerous"
}

# sanitize_env_file — Rewrite an env file to single-quote-wrap any values
# that contain dangerous shell metacharacters. Safe values are left unchanged.
#
# Usage: sanitize_env_file /path/to/env-file
sanitize_env_file() {
  local env_file="$1"
  local tmp_file
  tmp_file="$(mktemp "${env_file}.sanitize.XXXXXX")"
  local count=0

  while IFS= read -r line || [[ -n "$line" ]]; do
    # Pass through comments and blank lines unchanged
    if [[ "$line" =~ ^[[:space:]]*($|#) ]]; then
      echo "$line" >> "$tmp_file"
      continue
    fi

    local key="${line%%=*}"
    local raw_value="${line#*=}"

    # If not a valid KEY=VALUE line, pass through
    if [[ "$key" == "$line" ]] || ! [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      echo "$line" >> "$tmp_file"
      continue
    fi

    # If already single-quoted, pass through
    if [[ "$raw_value" == "'"* ]]; then
      echo "$line" >> "$tmp_file"
      continue
    fi

    # Check for dangerous patterns
    if [[ "$raw_value" =~ $'\x60' ]] || [[ "$raw_value" =~ '$(' ]]; then
      # Single-quote-wrap the value, escaping any embedded single quotes
      local escaped_value="${raw_value//\'/\'\"\'\"\'}"
      echo "${key}='${escaped_value}'" >> "$tmp_file"
      (( count++ ))
    else
      echo "$line" >> "$tmp_file"
    fi
  done < "$env_file"

  if (( count > 0 )); then
    mv "$tmp_file" "$env_file"
    echo "SECURITY WARNING: Sanitized $count env value(s) with shell metacharacters in $env_file" >&2
  else
    rm -f "$tmp_file"
  fi
}
