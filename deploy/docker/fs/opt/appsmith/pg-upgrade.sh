#!/bin/bash

set -o errexit
set -o nounset

# This script will upgrade Postgres to the "current" version of Postgres, if needed.

# Assumptions:
#   1. Postgres is currently not running. The caller of this script ensures that _no_ version of Postgres server is currently running.
#   2. The newest version of Postgres we want to use, is already installed.
#   3. Postgres is installed via apt package manager only.

# Contract:
#   1. Don't install old version of Postgres, if it's already installed.
#   2. Use absolute paths to all Postgres executables, don't rely on any of them to be coming from "\$PATH".
#   3. Be idempotent across versions.
#   4. When we can't proceed due to any exceptional scenarios, communicate clearly.
#   5. Mark old/stale/deprecated data with a date, so it can be deleted with confidence later.

# Check if any Postgres server is running
if pgrep -x "postgres" > /dev/null; then
  echo "Error: A Postgres server is currently running. Please stop it before proceeding with the upgrade."
  exit 1
fi

POSTGRES_PATH=/usr/lib/postgresql
PG_DATA_DIR=/appsmith-stacks/data/postgres/main

declare -a TO_UNINSTALL
TO_UNINSTALL=()

## The Postgres version that created the current data directory.
find-current-pg-version() {
  if [[ -f "$PG_DATA_DIR/PG_VERSION" ]]; then
    cat "$PG_DATA_DIR/PG_VERSION"
  fi
}

## Perform the upgrade with the given from-version and to-version arguments.
perform-upgrade() {
  local old_version="$1"
  local new_version="$2"
  local new_data_dir="$PG_DATA_DIR-$new_version"

  install-pg-if-needed "$old_version"

  prepare-pwd

  # Required by the temporary Postgres server started by `pg_upgrade`.
  chown postgres /etc/ssl/private/ssl-cert-snakeoil.key
  chmod 0600 /etc/ssl/private/ssl-cert-snakeoil.key

  su postgres --command "
    set -o errexit
    set -o xtrace
    '$POSTGRES_PATH/$new_version/bin/initdb' --pgdata='$new_data_dir'
    '$POSTGRES_PATH/$new_version/bin/pg_upgrade' \
      --old-datadir='$PG_DATA_DIR' \
      --new-datadir='$new_data_dir' \
      --old-bindir='$POSTGRES_PATH/$old_version/bin' \
      --new-bindir='$POSTGRES_PATH/$new_version/bin'
  "

  date -u '+%FT%T.%3NZ' > "$PG_DATA_DIR/deprecated-on.txt"
  mv -v "$PG_DATA_DIR" "$PG_DATA_DIR-$old_version"
  mv -v "$new_data_dir" "$PG_DATA_DIR"

  # Dangerous generated script that deletes the now updated data folder.
  rm -fv "$TMP/pg_upgrade/delete_old_cluster.sh"
}

install-pg-if-needed() {
  local version="$1"
  if [[ ! -e "$POSTGRES_PATH/$version" ]]; then
    apt-get update
    apt-get install --yes "postgresql-$version"
    TO_UNINSTALL+=("postgresql-$version")
  fi
}

## `pg_upgrade` writes log to current folder. So change to a temp folder first.
prepare-pwd() {
  rm -rf "$TMP/pg_upgrade" "$new_data_dir"
  mkdir -p "$TMP/pg_upgrade" "$new_data_dir"
  chown -R postgres "$TMP/pg_upgrade" "$new_data_dir"
  cd "$TMP/pg_upgrade"
}

CURRENT_VERSION="$(find-current-pg-version)"

if [[ -z "$CURRENT_VERSION" ]]; then
  tlog "No existing Postgres data found, not upgrading anything." >&2
  exit
fi

if [[ -f "$PG_DATA_DIR/postmaster.pid" ]]; then
  tlog "Previous Postgres was not shutdown cleanly. Please start and stop Postgres $CURRENT_VERSION properly with 'supervisorctl' only." >&2
  exit 1
fi

top_available_version="$(postgres --version | grep -o '[[:digit:]]\+' | head -1)"

if [[ "$CURRENT_VERSION" == 13 && "$top_available_version" > "$CURRENT_VERSION" ]]; then
  perform-upgrade "$CURRENT_VERSION" "$top_available_version"
  CURRENT_VERSION="$(find-current-pg-version)"
fi

if [[ "${#TO_UNINSTALL[@]}" -gt 0 ]]; then
  apt-get remove --yes "${TO_UNINSTALL[@]}"
  apt-get clean
fi

echo "== Fin =="
