#!/bin/bash

set -o errexit
set -o nounset

# Path to the FCV marker file in the Mongo data directory. Written here after we
# confirm the current featureCompatibilityVersion; read by entrypoint.sh on
# subsequent boots to fast-path the pre-flight compatibility check. See
# entrypoint.sh::ensure_mongodb_fcv_compatible.
MONGO_FCV_MARKER="/appsmith-stacks/data/mongodb/.appsmith-fcv"

write_fcv_marker() {
  local version="$1"
  local tmp="${MONGO_FCV_MARKER}.tmp"
  if ! printf '%s\n' "$version" > "$tmp" 2>/dev/null; then
    tlog "warning: failed to write FCV marker temp file"
    return 0
  fi
  mv -f "$tmp" "$MONGO_FCV_MARKER" 2>/dev/null || tlog "warning: failed to move FCV marker into place"
}

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
  # Read the current FCV and write it to the marker file. We deliberately do
  # NOT raise FCV to 7.0 — keeping it at 6.0 preserves the ability to roll back
  # to a 6.x Appsmith release if something goes wrong. (The entrypoint's
  # pre-flight check guarantees mongod won't reach this point with FCV < 6.0.)
  if fcv="$(mongosh --quiet "$APPSMITH_DB_URL" --eval '
    print(db.adminCommand({getParameter: 1, featureCompatibilityVersion: 1}).featureCompatibilityVersion.version);
  ' 2>/dev/null | tail -n 1)" && [[ "$fcv" =~ ^[0-9]+\.[0-9]+$ ]]; then
    tlog "MongoDB featureCompatibilityVersion: $fcv"
    write_fcv_marker "$fcv"
    break
  fi
  sleep 1
done

tlog Done

} | sed -u 's/^/mongodb-fixer: /'
