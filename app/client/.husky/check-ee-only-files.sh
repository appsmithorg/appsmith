#!/bin/bash

is_client_src_change=$(git diff --cached --name-only | grep -c "app/client/src")
is_client_ee_only_change=$(git diff --cached --name-only | grep -c "app/client/src/ee")

is_merge_commit=$(git rev-parse -q --verify MERGE_HEAD)

if [[ "$is_client_src_change" -eq 0 || "$is_client_src_change" -eq "$is_client_ee_only_change" || "$is_merge_commit" ]]; then
  echo "Skipping EE only check..."
else
  echo "Please commit all files, except 'client/src/ee/*', on CE repo & take an upstream pull..."
  exit 1
fi
