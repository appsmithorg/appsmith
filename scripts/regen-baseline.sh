#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail
if [[ ${TRACE-0} == 1 ]]; then
  set -o xtrace
fi

cat >/dev/null <<DOC
1. Run a new Appsmith container.
2. Wait for, and ensure backend server is up.
3. Kill backend.
4. Ensure connection to the embedded MongoDB.
5. Run the export script against the embedded MongoDB.
6. If needed, move the jsonl files to the right place.
Unfortunately, everytime this script runs, there will be a diff in the jsonl files. Always. This is because the ObjectID
values, and the "createdAt" values would be different everytime a new Appsmith container is started up. This is...
_okay_ for now. Since once we passover to only writing migrations on Postgres, these files will effectively be sealed.
So we have to put up with that "problem" only until then. Which makes it not worth our time to solve.
That said, please carefully review the diff nevertheless, keeping in mind the implementation of the migrations that
reads these files.
DOC

container_name=appsmith-for-baseline
project_root="$(git rev-parse --show-toplevel)"

edition=ce
if [[ "$(git remote get-url origin)" == *appsmithorg/appsmith-ee.git ]]; then
  edition=ee
fi

docker rm --force "$container_name"
docker run \
  --detach \
  --name "$container_name" \
  --pull always "appsmith/appsmith-$edition":release

docker cp \
  "$project_root/deploy/docker/fs/opt/appsmith/utils/bin/move-to-postgres.mjs" \
  "$container_name":/opt/appsmith/utils/export.mjs

docker exec "$container_name" bash -c '
set -o errexit
set -o nounset
sleep 25
for attempt in {1..99}; do
  if curl --silent --fail --fail-early 127.0.0.1:8080/api/v1/health; then
    break
  fi
  echo "Waiting for backend to come up..."
  sleep 2
done
supervisorctl stop editor postgres rts backend redis || true
source /appsmith-stacks/configuration/docker.env
node utils/export.mjs --mongodb-url="$APPSMITH_DB_URL" --baseline
'

baseline_dir="$project_root/deploy/docker/fs/opt/appsmith/baseline-$edition"
rm -rf "$baseline_dir"
docker cp "$container_name":/appsmith-stacks/mongo-data "$baseline_dir"
docker rm -f "$container_name"
echo Removed "$container_name" and copied the new baseline files.

echo Finish