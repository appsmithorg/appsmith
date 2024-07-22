#!/bin/bash

is_server_change=$(git diff --cached --name-only | grep -c "app/server")
is_client_change=$(git diff --cached --name-only | grep -c "app/client")

is_merge_commit=$(git rev-parse -q --verify MERGE_HEAD)

if [ "$is_merge_commit" ]; then
  echo "Skipping server and client checks for merge commit"
else
  if [ "$is_server_change" -ge 1 ]; then
    echo "- Applying Spotless to server files..."
    pushd app/server > /dev/null
    if mvn spotless:apply; then
      echo "✔ Spotless applied successfully to server files"
      git add .
      popd > /dev/null
    else
      echo "Spotless apply failed for server files"
      popd > /dev/null
      exit 1
    fi
  else
    echo "Skipping server side check..."
  fi

  if [ "$is_client_change" -ge 1 ]; then
    echo "Running client check ..."
    npx lint-staged --cwd app/client
  else
    echo "Skipping client side check..."
  fi
fi
