#!/usr/bin/env bash
# Tests for client-build-cache.sh. Fails when two client build variants resolve to the
# same cache location, when a bundle of one variant passes verification for another, or
# when a bundle built from another app/client tree passes as a build of the checkout.

set -euo pipefail

SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/client-build-cache.sh"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

cache_script() {
  bash "$SCRIPT" "$@"
}

failures=0

pass() {
  echo "ok - $1"
}

fail() {
  echo "not ok - $1"
  failures=$((failures + 1))
}

assert_equals() {
  local description="$1" expected="$2" actual="$3"
  if [[ "$expected" == "$actual" ]]; then
    pass "$description"
  else
    fail "$description (expected '$expected', got '$actual')"
  fi
}

assert_succeeds() {
  local description="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    pass "$description"
  else
    fail "$description (exit $?)"
  fi
}

assert_fails() {
  local description="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    fail "$description (expected a failure, got success)"
  else
    pass "$description"
  fi
}

assert_exit_code() {
  local description="$1" expected="$2"
  shift 2
  local actual=0
  "$@" >/dev/null 2>&1 || actual=$?
  assert_equals "$description" "$expected" "$actual"
}

assert_output_contains() {
  local description="$1" expected="$2"
  shift 2
  local output
  output="$("$@" 2>&1 || true)"
  if [[ "$output" == *"$expected"* ]]; then
    pass "$description"
  else
    fail "$description (output did not contain '$expected')"
  fi
}

# Cache locations
locations=()
for repo in appsmith appsmith-ee; do
  for variant in default airgap; do
    locations+=("$(cache_script dir "$repo" "$variant")")
  done
done

unique_count="$(printf '%s\n' "${locations[@]}" | sort -u | wc -l | tr -d '[:space:]')"
assert_equals "every repository and variant resolves to its own cache location" "${#locations[@]}" "$unique_count"

assert_equals "CE default location" "CE/release/client" "$(cache_script dir appsmith default)"
assert_equals "EE default location" "EE/release/client" "$(cache_script dir appsmith-ee default)"
assert_equals "EE airgap location" "EE/release/client-airgap" "$(cache_script dir appsmith-ee airgap)"

assert_fails "an unknown variant has no cache location" cache_script dir appsmith-ee other
assert_fails "an empty variant has no cache location" cache_script dir appsmith-ee ""
assert_fails "an unknown repository has no cache location" cache_script dir other default

# Bundle verification
source_checkout="$WORK_DIR/source"
mkdir -p "$source_checkout/app/client"
git -C "$source_checkout" init --quiet
git -C "$source_checkout" config user.email "test@example.com"
git -C "$source_checkout" config user.name "test"
echo "one" > "$source_checkout/app/client/file.txt"
git -C "$source_checkout" add .
git -C "$source_checkout" commit --quiet --no-verify -m "one"

cache_script info default "$source_checkout" > "$WORK_DIR/default-info.txt"
cache_script info airgap "$source_checkout" > "$WORK_DIR/airgap-info.txt"

assert_equals "info records the variant" "variant=airgap" "$(grep -E '^variant=' "$WORK_DIR/airgap-info.txt")"
assert_equals "info records the source commit" \
  "source_sha=$(git -C "$source_checkout" rev-parse HEAD)" \
  "$(grep -E '^source_sha=' "$WORK_DIR/airgap-info.txt")"
assert_fails "info rejects an unknown variant" cache_script info other "$source_checkout"

assert_succeeds "a default bundle verifies for a default build" \
  cache_script verify "$WORK_DIR/default-info.txt" default "$source_checkout"
assert_succeeds "an airgap bundle verifies for an airgap build" \
  cache_script verify "$WORK_DIR/airgap-info.txt" airgap "$source_checkout"
assert_exit_code "an airgap bundle is rejected for a default build" 1 \
  cache_script verify "$WORK_DIR/airgap-info.txt" default "$source_checkout"
assert_exit_code "a default bundle is rejected for an airgap build" 1 \
  cache_script verify "$WORK_DIR/default-info.txt" airgap "$source_checkout"

assert_exit_code "an airgap bundle without info is rejected" 1 \
  cache_script verify "$WORK_DIR/missing.txt" airgap "$source_checkout"
assert_exit_code "a default bundle without info does not stand in for a build" 3 \
  cache_script verify "$WORK_DIR/missing.txt" default "$source_checkout"
assert_output_contains "a default bundle without info is reported" "::notice::" \
  cache_script verify "$WORK_DIR/missing.txt" default "$source_checkout"

grep -v -E '^client_tree=' "$WORK_DIR/default-info.txt" > "$WORK_DIR/no-tree-info.txt"
assert_exit_code "a bundle whose info has no client tree does not stand in for a build" 3 \
  cache_script verify "$WORK_DIR/no-tree-info.txt" default "$source_checkout"
grep -v -E '^variant=' "$WORK_DIR/default-info.txt" > "$WORK_DIR/no-variant-info.txt"
assert_exit_code "a bundle whose info has no variant is rejected" 1 \
  cache_script verify "$WORK_DIR/no-variant-info.txt" default "$source_checkout"
assert_output_contains "a bundle whose info has no variant is reported" "::error::" \
  cache_script verify "$WORK_DIR/no-variant-info.txt" default "$source_checkout"

echo "outside the client" > "$source_checkout/README.md"
git -C "$source_checkout" add .
git -C "$source_checkout" commit --quiet --no-verify -m "outside the client"
assert_exit_code "a bundle verifies after a commit that leaves app/client alone" 0 \
  cache_script verify "$WORK_DIR/default-info.txt" default "$source_checkout"

echo "two" > "$source_checkout/app/client/file.txt"
git -C "$source_checkout" commit --quiet --no-verify -am "two"
assert_exit_code "a bundle from another client tree does not stand in for a build" 3 \
  cache_script verify "$WORK_DIR/default-info.txt" default "$source_checkout"
assert_output_contains "a bundle from another client tree is reported" "::notice::" \
  cache_script verify "$WORK_DIR/default-info.txt" default "$source_checkout"
assert_exit_code "a bundle of another variant is rejected before its tree is compared" 1 \
  cache_script verify "$WORK_DIR/airgap-info.txt" default "$source_checkout"

if [[ "$failures" -gt 0 ]]; then
  echo "$failures test(s) failed"
  exit 1
fi
echo "All tests passed"
