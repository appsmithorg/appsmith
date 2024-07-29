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

postgres_path=/usr/lib/postgresql

pg_data_dir=/appsmith-stacks/data/postgres/main

old_version=""
if [[ -f "$pg_data_dir/PG_VERSION" ]]; then
	old_version="$(cat "$pg_data_dir/PG_VERSION")"
fi

if [[ -z "$old_version" ]]; then
	tlog "No existing Postgres data found, not upgrading anything." >&2
	exit
fi

top_available_version="$(postgres --version | grep -o '[[:digit:]]\+' | head -1)"

declare -a to_uninstall
to_uninstall=()

# 13 to 14
if [[ "$old_version" == 13 && "$top_available_version" > "$old_version" ]]; then
	if [[ ! -e "$postgres_path/$old_version" ]]; then
		apt-get update
		apt-get install --yes "postgresql-$old_version"
		to_uninstall+=("postgresql-$old_version")
	fi

	if [[ -f "$pg_data_dir/postmaster.pid" ]]; then
		# Start old PostgreSQL using pg_ctl
		tlog "Stale postmaster.pid found. Starting old PostgreSQL $old_version using pg_ctl to cleanup."
		su postgres -c "$postgres_path/$old_version/bin/pg_ctl start -D '$pg_data_dir' "

		# Wait for old PostgreSQL to be ready
		until su postgres -c "$postgres_path/$old_version/bin/pg_isready"; do
			tlog "Waiting for PostgreSQL $old_version to start..."
			sleep 1
		done

		# Shut down PostgreSQL gracefully using pg_ctl
		su postgres -c "$postgres_path/$old_version/bin/pg_ctl stop -D '$pg_data_dir' -m smart"
		tlog "PostgreSQL $old_version has been shut down."
	fi

	new_version="$((old_version + 1))"
	new_data_dir="$pg_data_dir-$new_version"

	# `pg_upgrade` writes log to current folder. So change to a temp folder first.
	rm -rf "$TMP/pg_upgrade" "$new_data_dir"
	mkdir -p "$TMP/pg_upgrade" "$new_data_dir"
	chown -R postgres "$TMP/pg_upgrade" "$new_data_dir"
	cd "$TMP/pg_upgrade"

	# Required by the temporary Postgres server started by `pg_upgrade`.
	chown postgres /etc/ssl/private/ssl-cert-snakeoil.key
	chmod 0600 /etc/ssl/private/ssl-cert-snakeoil.key

	su postgres --command "
		set -o errexit
		set -o xtrace
		'$postgres_path/$new_version/bin/initdb' --pgdata='$new_data_dir'
		'$postgres_path/$new_version/bin/pg_upgrade' \
			--old-datadir='$pg_data_dir' \
			--new-datadir='$new_data_dir' \
			--old-bindir='$postgres_path/$old_version/bin' \
			--new-bindir='$postgres_path/$new_version/bin'
	"

	date -u '+%FT%T.%3NZ' > "$pg_data_dir/deprecated-on.txt"
	mv -v "$pg_data_dir" "$pg_data_dir-$old_version"
	mv -v "$new_data_dir" "$pg_data_dir"

	# Dangerous generated script that deletes the now updated data folder.
	rm -fv "$TMP/pg_upgrade/delete_old_cluster.sh"
fi

if [[ -n "${#to_uninstall[@]}" ]]; then
	DEBIAN_FRONTEND=noninteractive apt-get purge --yes "${to_uninstall[@]}"
	apt-get clean
fi

echo "== Fin =="
