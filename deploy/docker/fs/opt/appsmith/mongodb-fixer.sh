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

# Minimum FCV this Appsmith release commits to preserve. We raise this to 7.0
# (up from 6.0) as groundwork for the upcoming MongoDB 8.x upgrade: MongoDB 8.x
# refuses to start on data below FCV 7.0, so we bump the data to 7.0 now, while
# this release still runs MongoDB 7.x. A later release can then ship MongoDB 8.x
# and boot cleanly on data that is already at FCV 7.0.
#
# This release still ships MongoDB 7.x, whose binary only requires FCV >= 6.0 to
# start (see entrypoint.sh::ensure_mongodb_fcv_compatible). The 7.0 floor here is
# forward-prep applied by the block below, not a startup requirement yet — the
# pre-flight check in entrypoint.sh is intentionally left at the 6.0 mongod floor.
#
# Tradeoff: raising FCV to 7.0 forfeits the ability to roll back to an Appsmith
# release that bundles MongoDB 6.x (1.99 and earlier) without first deleting the
# Mongo data files. Instances on this release are well past that line, so this is
# an accepted one-way step.
FCV_MIN="7.0"

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

# Ensure FCV is at the floor this release commits to. On the first boot of a
# release that raises the floor, this performs the actual upgrade — e.g. issuing
# setFeatureCompatibilityVersion to carry data from 6.0 up to 7.0. Because the
# floor (7.0) now sits above the minimum FCV the embedded MongoDB 7.x binary needs
# to start (6.0), this block — not entrypoint.sh's pre-flight probe — is what
# raises the data to the committed floor. Once the data is already at the floor it
# is a no-op, so it stays safe to run on every boot.
tlog "Ensuring MongoDB featureCompatibilityVersion is at least $FCV_MIN"
for _ in {1..60}; do
  if mongosh --quiet "$APPSMITH_DB_URL" --eval '
    const floor = '"$FCV_MIN"';
    const current = parseFloat(db.adminCommand({getParameter: 1, featureCompatibilityVersion: 1}).featureCompatibilityVersion.version);
    if (current < floor) {
      db.adminCommand({setFeatureCompatibilityVersion: "'"$FCV_MIN"'", confirm: true});
    }
  '; then
    tlog "MongoDB featureCompatibilityVersion floor of $FCV_MIN confirmed"
    break
  fi
  sleep 1
done

tlog "Recording committed FCV minimum: $FCV_MIN"
write_fcv_marker "$FCV_MIN"
tlog Done

} | sed -u 's/^/mongodb-fixer: /'
