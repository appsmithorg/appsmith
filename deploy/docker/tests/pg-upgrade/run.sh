#!/bin/bash -eux

# A script to test Postgres upgrades.

# Appsmith upto and including v1.29 has Postgres v13.

from_tag="${1:-appsmith/appsmith-ce:v1.29}"
to_tag="${2:-appsmith/appsmith-ce:latest}"

expected_target_version=15

container_name=appsmith-pg-upgrade-test
port=20080

docker rm -f "$container_name"
docker volume rm --force "$container_name"

# TODO: Add `--pull always` for images that have a manifest?

docker volume create "$container_name"
docker run \
  --name "$container_name" \
  --detach \
  --publish "$port":80 \
  --volume "$container_name":/appsmith-stacks \
  "$from_tag"

wait-for-supervisor() {
  while ! docker exec "$container_name" test -e /tmp/appsmith/supervisor.sock; do
    sleep 1
  done
  sleep 2
}

wait-for-supervisor

docker exec "$container_name" bash -exc '
supervisorctl status \
  | awk '\''$1 != "postgres" && $1 != "stdout" {print $1}'\'' \
  | xargs supervisorctl stop

# Insert some sample data
su postgres -c "psql -h 127.0.0.1 -c \"
create table t (id serial, name text);
insert into t values (1, '\''one'\'');
insert into t values (2, '\''two'\'');
insert into t values (3, '\''three'\'');
\""

supervisorctl stop postgres

cat /appsmith-stacks/data/postgres/main/PG_VERSION
'

docker rm -f "$container_name"

docker run \
  --name "$container_name" \
  --detach \
  --publish "$port":80 \
  --volume "$container_name":/appsmith-stacks \
  "$to_tag"

wait-for-supervisor

status=0

if [[ "$expected_target_version" != "$(docker exec "$container_name" cat /appsmith-stacks/data/postgres/main/PG_VERSION)" ]]; then
  echo "Version isn't $expected_target_version"
  status=1
else
  sample_table_contents="$(
    docker exec "$container_name" bash -exc 'su postgres -c "psql -h 127.0.0.1 -c \"select * from t\""' \
      | sed 's/[[:space:]]*$//'
  )"
  expected_contents=' id | name
----+-------
  1 | one
  2 | two
  3 | three
(3 rows)'
  if diff <(echo "$expected_contents") <(echo "$sample_table_contents"); then
    echo "All okay"
  else
    status=1
    echo "Table contents mismatch. Found this:"
    echo "$sample_table_contents"
    echo "Instead of this:"
    echo "$expected_contents"
    if [[ -z "${CI-}" ]]; then
      echo "Entering a shell for troubleshooting"
      docker exec -it "$container_name" bash
    fi
  fi
fi

docker rm --force "$container_name"
docker volume rm --force "$container_name"

exit "$status"
