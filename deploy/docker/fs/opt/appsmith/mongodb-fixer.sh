#!/bin/bash

set -o errexit
set -o nounset

{

while [[ ! -S "$TMP/supervisor.sock" ]]; do
  sleep 1
done
tlog "supervisor.sock found"

while supervisorctl status mongodb | grep -q RUNNING; do
  sleep 1
done
tlog "MongoDB is RUNNING"

for _ in {1..60}; do
  if mongosh --quiet "$APPSMITH_DB_URL" --eval '
    parseFloat(db.adminCommand({getParameter: 1, featureCompatibilityVersion: 1}).featureCompatibilityVersion.version) < 7 &&
      db.adminCommand({setFeatureCompatibilityVersion: "7.0", confirm: true})
  '; then
    tlog "MongoDB featureCompatibilityVersion set to 7.0"
    break
  fi
  sleep 1
done

tlog Done

} | sed -u 's/^/mongodb-fixer: /'
