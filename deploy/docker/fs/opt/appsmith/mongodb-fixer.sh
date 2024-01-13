#!/bin/bash

set -o errexit
set -o nounset

{

while [[ ! -S "$TMP/supervisor.sock" ]]; do
  sleep 1
done
echo "supervisor.sock found"

while supervisorctl status mongodb | grep -q RUNNING; do
  sleep 1
done
echo "MongoDB is RUNNING"

for _ in {1..60}; do
  if mongosh --quiet "$APPSMITH_MONGODB_URI" --eval '
    parseFloat(db.adminCommand({getParameter: 1, featureCompatibilityVersion: 1}).featureCompatibilityVersion.version) < 5 &&
      db.adminCommand({setFeatureCompatibilityVersion: "5.0"})
  '; then
    echo "MongoDB version set to 5.0"
    break
  fi
  sleep 1
done

echo Done

} | sed -u 's/^/mongodb-fixer: /'
