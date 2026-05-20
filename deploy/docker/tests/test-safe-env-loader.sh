#!/usr/bin/env bash
# Tests for GHSA-h6hh-wqxc-5hw9 defense-in-depth: safe env file loading

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOADER_SCRIPT="$SCRIPT_DIR/../fs/opt/appsmith/safe-env-loader.sh"

PASS=0
FAIL=0
TEST_TMPDIR=""

setup() {
  TEST_TMPDIR="$(mktemp -d)"
}

teardown() {
  rm -rf "$TEST_TMPDIR"
}

assert_equals() {
  local actual="$1" expected="$2" msg="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "    FAIL: $msg"
    echo "      expected: '$expected'"
    echo "      actual:   '$actual'"
    return 1
  fi
  return 0
}

assert_not_exists() {
  local path="$1" msg="$2"
  if [[ -e "$path" ]]; then
    echo "    FAIL: $msg (file should not exist: $path)"
    return 1
  fi
  return 0
}

run_test() {
  local test_name="$1"
  setup
  local result=0
  "$test_name" || result=$?
  teardown
  if [[ "$result" -eq 0 ]]; then
    echo "  PASS: $test_name"
    PASS=$(( PASS + 1 ))
  else
    echo "  FAIL: $test_name"
    FAIL=$(( FAIL + 1 ))
  fi
}

# --- safe_source_env tests ---

test_simple_unquoted_values() {
  cat > "$TEST_TMPDIR/env" <<'EOF'
APPSMITH_DB_URL=mongodb://localhost:27017
APPSMITH_REDIS_URL=redis://127.0.0.1:6379
EOF
  local result
  result=$(bash -c "
    source '$LOADER_SCRIPT'
    safe_source_env '$TEST_TMPDIR/env'
    echo \"\$APPSMITH_DB_URL|\$APPSMITH_REDIS_URL\"
  ")
  assert_equals "$result" "mongodb://localhost:27017|redis://127.0.0.1:6379" "simple unquoted values"
}

test_single_quoted_values() {
  cat > "$TEST_TMPDIR/env" <<'EOF'
APPSMITH_DB_URL='mongodb://localhost:27017/appsmith'
APPSMITH_INSTANCE_NAME='My Instance'
EOF
  local result
  result=$(bash -c "
    source '$LOADER_SCRIPT'
    safe_source_env '$TEST_TMPDIR/env'
    echo \"\$APPSMITH_DB_URL|\$APPSMITH_INSTANCE_NAME\"
  ")
  assert_equals "$result" "mongodb://localhost:27017/appsmith|My Instance" "single-quoted values"
}

test_double_quoted_values() {
  cat > "$TEST_TMPDIR/env" <<'EOF'
APPSMITH_INSTANCE_NAME="My Instance"
APPSMITH_DB_URL="mongodb://localhost:27017"
EOF
  local result
  result=$(bash -c "
    source '$LOADER_SCRIPT'
    safe_source_env '$TEST_TMPDIR/env'
    echo \"\$APPSMITH_INSTANCE_NAME|\$APPSMITH_DB_URL\"
  ")
  assert_equals "$result" "My Instance|mongodb://localhost:27017" "double-quoted values"
}

test_embedded_single_quotes() {
  # escapeForShell produces: 'Sponge-bob'"'"'s Instance'
  cat > "$TEST_TMPDIR/env" <<'ENDOFFILE'
APPSMITH_INSTANCE_NAME='Sponge-bob'"'"'s Instance'
ENDOFFILE
  local result
  result=$(bash -c "
    source '$LOADER_SCRIPT'
    safe_source_env '$TEST_TMPDIR/env'
    echo \"\$APPSMITH_INSTANCE_NAME\"
  ")
  assert_equals "$result" "Sponge-bob's Instance" "embedded single quote via shell escape"
}

test_empty_values() {
  cat > "$TEST_TMPDIR/env" <<'EOF'
APPSMITH_DB_URL=
APPSMITH_INSTANCE_NAME=
EOF
  local result
  result=$(bash -c "
    source '$LOADER_SCRIPT'
    safe_source_env '$TEST_TMPDIR/env'
    echo \"db=[\$APPSMITH_DB_URL] name=[\$APPSMITH_INSTANCE_NAME]\"
  ")
  assert_equals "$result" "db=[] name=[]" "empty values"
}

test_comments_and_blank_lines_skipped() {
  cat > "$TEST_TMPDIR/env" <<'EOF'
# This is a comment
APPSMITH_DB_URL=value1

# Another comment
APPSMITH_REDIS_URL=value2

EOF
  local result
  result=$(bash -c "
    source '$LOADER_SCRIPT'
    safe_source_env '$TEST_TMPDIR/env'
    echo \"\$APPSMITH_DB_URL|\$APPSMITH_REDIS_URL\"
  ")
  assert_equals "$result" "value1|value2" "comments and blank lines skipped"
}

test_command_substitution_not_executed() {
  local marker="$TEST_TMPDIR/pwned_cmd"
  cat > "$TEST_TMPDIR/env" <<EOF
APPSMITH_INSTANCE_NAME=\$(touch ${marker})Appsmith
EOF
  bash -c "
    source '$LOADER_SCRIPT'
    safe_source_env '$TEST_TMPDIR/env'
  " 2>/dev/null
  assert_not_exists "$marker" "command substitution must NOT execute"
}

test_backtick_substitution_not_executed() {
  local marker="$TEST_TMPDIR/pwned_bt"
  printf 'APPSMITH_INSTANCE_NAME=`touch %s`Appsmith\n' "$marker" > "$TEST_TMPDIR/env"
  bash -c "
    source '$LOADER_SCRIPT'
    safe_source_env '$TEST_TMPDIR/env'
  " 2>/dev/null
  assert_not_exists "$marker" "backtick substitution must NOT execute"
}

test_semicolon_not_executed() {
  local marker="$TEST_TMPDIR/pwned_semi"
  cat > "$TEST_TMPDIR/env" <<EOF
APPSMITH_INSTANCE_NAME=safe; touch ${marker}
EOF
  bash -c "
    source '$LOADER_SCRIPT'
    safe_source_env '$TEST_TMPDIR/env'
  " 2>/dev/null
  assert_not_exists "$marker" "semicolon command must NOT execute"
}

test_dollar_brace_not_expanded() {
  cat > "$TEST_TMPDIR/env" <<'EOF'
APPSMITH_INSTANCE_NAME=${HOME}rest
EOF
  local result
  result=$(bash -c "
    source '$LOADER_SCRIPT'
    safe_source_env '$TEST_TMPDIR/env'
    echo \"\$APPSMITH_INSTANCE_NAME\"
  ")
  assert_equals "$result" '${HOME}rest' "dollar-brace must be literal"
}

test_safe_quoted_command_substitution_is_literal() {
  cat > "$TEST_TMPDIR/env" <<'EOF'
APPSMITH_INSTANCE_NAME='$(touch /tmp/pwned)'
EOF
  local result
  result=$(bash -c "
    source '$LOADER_SCRIPT'
    safe_source_env '$TEST_TMPDIR/env'
    echo \"\$APPSMITH_INSTANCE_NAME\"
  ")
  assert_equals "$result" '$(touch /tmp/pwned)' "single-quoted cmd sub is literal"
}

# --- validate_env_file tests ---

test_validate_clean_file_passes() {
  cat > "$TEST_TMPDIR/env" <<'EOF'
APPSMITH_DB_URL='mongodb://localhost:27017'
APPSMITH_INSTANCE_NAME=MyInstance
APPSMITH_REDIS_URL=redis://localhost:6379
EOF
  bash -c "
    source '$LOADER_SCRIPT'
    validate_env_file '$TEST_TMPDIR/env'
  " 2>/dev/null
}

test_validate_detects_unquoted_command_substitution() {
  cat > "$TEST_TMPDIR/env" <<'EOF'
APPSMITH_INSTANCE_NAME=$(touch /tmp/pwned)Appsmith
EOF
  if bash -c "
    source '$LOADER_SCRIPT'
    validate_env_file '$TEST_TMPDIR/env'
  " 2>/dev/null; then
    echo "    FAIL: should detect unquoted command substitution"
    return 1
  fi
  return 0
}

test_validate_detects_backtick() {
  printf 'APPSMITH_INSTANCE_NAME=`id`\n' > "$TEST_TMPDIR/env"
  if bash -c "
    source '$LOADER_SCRIPT'
    validate_env_file '$TEST_TMPDIR/env'
  " 2>/dev/null; then
    echo "    FAIL: should detect backtick substitution"
    return 1
  fi
  return 0
}

test_validate_allows_quoted_dangerous_values() {
  cat > "$TEST_TMPDIR/env" <<'EOF'
APPSMITH_INSTANCE_NAME='$(touch /tmp/pwned)'
EOF
  bash -c "
    source '$LOADER_SCRIPT'
    validate_env_file '$TEST_TMPDIR/env'
  " 2>/dev/null
}

# --- sanitize_env_file tests ---

test_sanitize_wraps_dangerous_values() {
  cat > "$TEST_TMPDIR/env" <<'EOF'
APPSMITH_DB_URL=safe_value
APPSMITH_INSTANCE_NAME=$(touch /tmp/pwned)Appsmith
EOF
  bash -c "
    source '$LOADER_SCRIPT'
    sanitize_env_file '$TEST_TMPDIR/env'
  " 2>/dev/null
  # After sanitization the file should pass validation
  if ! bash -c "
    source '$LOADER_SCRIPT'
    validate_env_file '$TEST_TMPDIR/env'
  " 2>/dev/null; then
    echo "    FAIL: sanitized file should pass validation"
    return 1
  fi
  # Safe value should remain unchanged
  if ! grep -q "^APPSMITH_DB_URL=safe_value$" "$TEST_TMPDIR/env"; then
    echo "    FAIL: safe value should remain unchanged after sanitize"
    return 1
  fi
  return 0
}

test_values_exported_to_environment() {
  cat > "$TEST_TMPDIR/env" <<'EOF'
APPSMITH_TEST_EXPORT_VAR='hello world'
EOF
  local result
  result=$(bash -c "
    source '$LOADER_SCRIPT'
    safe_source_env '$TEST_TMPDIR/env'
    echo \"\$APPSMITH_TEST_EXPORT_VAR\"
  ")
  assert_equals "$result" "hello world" "variable must be exported"
}

test_ifs_trick_not_executed() {
  local marker="$TEST_TMPDIR/pwned_ifs"
  # The actual PoC payload shape from the advisory
  cat > "$TEST_TMPDIR/env" <<EOF
APPSMITH_INSTANCE_NAME=\$(echo\${IFS}dG91Y2ggJHttYXJrZXJ9|base64\${IFS}-d|bash)Appsmith
EOF
  bash -c "
    source '$LOADER_SCRIPT'
    safe_source_env '$TEST_TMPDIR/env'
  " 2>/dev/null
  assert_not_exists "$marker" "IFS-based payload must NOT execute"
}

# --- Run all tests ---

echo "========================================"
echo "GHSA-h6hh-wqxc-5hw9 Safe Env Loader Tests"
echo "========================================"
echo ""

if [[ ! -f "$LOADER_SCRIPT" ]]; then
  echo "FATAL: safe-env-loader.sh not found at $LOADER_SCRIPT"
  exit 1
fi

run_test test_simple_unquoted_values
run_test test_single_quoted_values
run_test test_double_quoted_values
run_test test_embedded_single_quotes
run_test test_empty_values
run_test test_comments_and_blank_lines_skipped
run_test test_command_substitution_not_executed
run_test test_backtick_substitution_not_executed
run_test test_semicolon_not_executed
run_test test_dollar_brace_not_expanded
run_test test_safe_quoted_command_substitution_is_literal
run_test test_validate_clean_file_passes
run_test test_validate_detects_unquoted_command_substitution
run_test test_validate_detects_backtick
run_test test_validate_allows_quoted_dangerous_values
run_test test_sanitize_wraps_dangerous_values
run_test test_values_exported_to_environment
run_test test_ifs_trick_not_executed

echo ""
echo "========================================"
echo "Results: $PASS passed, $FAIL failed"
echo "========================================"

if (( FAIL > 0 )); then
  exit 1
fi
