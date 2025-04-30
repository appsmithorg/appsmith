#!/bin/bash

is_server_change=$(git diff --cached --name-only | grep -c "app/server")
is_client_change=$(git diff --cached --name-only | grep -c "app/client")
is_package_json_change=$(git diff --cached --name-only | grep -c "app/client/package.json")

is_merge_commit=$(git rev-parse -q --verify MERGE_HEAD)

# Function to check TinyMCE version changes
check_tinymce_version() {
  # Check if TinyMCE version is being changed
  if git diff --cached app/client/package.json | grep -q '^-.*"tinymce": "6\.8\.3"' &&
    git diff --cached app/client/package.json | grep -q '^+.*"tinymce": "[^"]*"'; then
    echo "❌ Error: Attempting to change TinyMCE version. This is not allowed as per team decision."
    echo "Please keep TinyMCE at version 6.8.3"
    exit 1
  fi
}

# Function to apply Spotless and only commit staged files
apply_spotless_and_commit_staged_files() {
  staged_server_files=$(git diff --cached --name-only | grep "app/server" | sed 's|app/server/||')
  mvn spotless:apply
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
  if [ "$is_package_json_change" -ge 1 ]; then
    echo "Checking package.json changes..."
    check_tinymce_version
  fi

  if [ "$is_server_change" -ge 1 ]; then
    echo "Applying Spotless to server files..."
    pushd app/server >/dev/null
    apply_spotless_and_commit_staged_files
    popd >/dev/null
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
