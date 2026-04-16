#!/bin/bash

set -o errexit
set -o nounset

# Marker file recording the minimum MongoDB featureCompatibilityVersion that
# this Appsmith release commits to preserve. Written once mongod is confirmed
# RUNNING under this release; read (presence only) by entrypoint.sh on
# subsequent boots to fast-path the pre-flight compatibility check. See
# entrypoint.sh::ensure_mongodb_fcv_compatible.
#
# The marker value is a release-level contract, not a live reading of mongod's
# current FCV. Use `mongosh` if you want the live value.
MONGO_FCV_MIN_MARKER="/appsmith-stacks/data/mongodb/.appsmith-mongo-fcv-min"

# Minimum FCV this Appsmith release commits to preserve. We deliberately do
# NOT raise FCV to 7.0 — keeping it at 6.0 preserves the ability to roll back
# to a 6.x Appsmith release if something goes wrong. When MongoDB 8 arrives
# and needs FCV bumped to 7.0, change this constant and add a
# `setFeatureCompatibilityVersion("7.0", {confirm: true})` call before writing
# the marker.
FCV_MIN="6.0"

write_fcv_marker() {
  local value="$1"
  local tmp="${MONGO_FCV_MIN_MARKER}.tmp"
  if ! printf '%s\n' "$value" > "$tmp" 2>/dev/null; then
    tlog "warning: failed to write FCV marker temp file"
    return 0
  fi
  mv -f "$tmp" "$MONGO_FCV_MIN_MARKER" 2>/dev/null || tlog "warning: failed to move FCV marker into place"
}

{

while [[ ! -S "$TMP/supervisor.sock" ]]; do
  sleep 1
done
tlog "supervisor.sock found"

while ! supervisorctl status mongodb | grep -q RUNNING; do
  sleep 1
done
tlog "MongoDB is RUNNING"

tlog "Recording committed FCV minimum: $FCV_MIN"
write_fcv_marker "$FCV_MIN"
tlog Done

} | sed -u 's/^/mongodb-fixer: /'
