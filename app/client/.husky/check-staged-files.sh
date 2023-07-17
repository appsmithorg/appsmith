#!/bin/bash

is_server_change=$(git diff --cached --name-only | grep -c "app/server")
is_client_change=$(git diff --cached --name-only | grep -c "app/client")

if [ "$is_server_change" -ge 1 ]; then
  echo "Running Spotless check ..."
    pushd app/server > /dev/null
    if (mvn spotless:check 1> /dev/null && popd > /dev/null) then
      popd
    else
      echo "Spotless check failed, please run mvn spotless:apply"
      exit 1
    fi
else
    echo "Skipping server side check..."
fi

if [ "$is_client_change" -ge 1  ]; then
  echo "Running client check ..."
  npx lint-staged --cwd app/client && git-secrets --scan --untracked && git-secrets --scan -r
else
  echo "Skipping client side check..."
fi
