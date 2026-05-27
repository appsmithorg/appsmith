#!/bin/bash

is_server_change=$(git diff --cached --name-only | grep -c "app/server")
is_client_change=$(git diff --cached --name-only | grep -c "app/client")

is_merge_commit=$(git rev-parse -q --verify MERGE_HEAD)

# Function to apply Spotless and only commit staged files.
# Runs mvn in a subshell so we don't pushd the script's cwd into app/server.
# Staging from the worktree root with full paths avoids a worktree-only bug:
# git invokes hooks with GIT_DIR set but GIT_WORK_TREE unset, so `git add` from
# a subdirectory treats cwd as the worktree root and stages files at the wrong path.
apply_spotless_and_commit_staged_files() {
  staged_server_files=$(git diff --cached --name-only | grep "app/server")
  (cd app/server && mvn spotless:apply)
   # Check if Spotless succeeded
  if [ $? -ne 0 ]; then
    echo "Spotless apply failed, Please run mvn spotless:apply"
    exit 1
  fi
  echo "$staged_server_files" | xargs git add
  echo "✔ Spotless applied successfully to server files"
}

if [ "$is_merge_commit" ]; then
  echo "Skipping server and client checks for merge commit"
else
  if [ "$is_server_change" -ge 1 ]; then
    echo "Applying Spotless to server files..."
    apply_spotless_and_commit_staged_files
  else
    echo "Skipping server side check..."
  fi

  if [ "$is_client_change" -ge 1 ]; then
    echo "Running client check..."
    npx lint-staged --cwd app/client
  else
    echo "Skipping client side check..."
  fi
fi
