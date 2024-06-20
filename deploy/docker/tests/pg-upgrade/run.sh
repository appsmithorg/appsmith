#!/bin/bash

# A script to test Postgres upgrades. WIP.

set -o errexit
set -o nounset
set -o xtrace

from_tag=appsmith/appsmith-ce:v1.28
to_tag=appsmith/appsmith-ce:latest

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

if [[ 14 != "$(docker exec "$container_name" cat /appsmith-stacks/data/postgres/main/PG_VERSION)" ]]; then
  echo "Version isn't 14"
  status=1
else
  sample_table_contents="$(su postgres -c 'psql -h 127.0.0.1 -c "select * from t"')"
  expected_contents=' id | name
----+-------
  1 | one
  2 | two
  3 | three
(3 rows)'
  if ! diff <(echo "$expected_contents") <(su postgres -c 'psql -h 127.0.0.1 -c "select * from t"'); then
    status=1
    echo "Table contents mismatch. Found this:"
    su postgres -c 'psql -h 127.0.0.1 -c "select * from t"'
    echo "Instead of this:"
    echo "$expected_contents"
  fi
fi

docker exec -it "$container_name" bash

docker rm --force "$container_name"
docker volume rm --force "$container_name"

exit "$status"
