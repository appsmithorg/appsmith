#!/bin/bash -eux

cd "$(git rev-parse --show-toplevel)"

if [[ -z "${EDITION-}" ]]; then
  export EDITION=ce
  if [[ "$(git remote get-url origin)" == *appsmithorg/appsmith-ee* ]]; then
    export EDITION=ee
  fi
fi

PG_TAG="${PG_TAG-pg}"
echo "Will be copying pg server artifacts from appsmith-$EDITION:$PG_TAG"

target="deploy/docker/fs/opt/appsmith/server"
mkdir -p "$target"
rm -rf "$target"/{pg,mongo}

cp -r "app/server/dist" "$target/mongo"
mv "$target/mongo"/server-*.jar "$target/mongo/server.jar"

# Grab PostgreSQL server artifacts from Docker image.
image="appsmith/appsmith-$EDITION:$PG_TAG"
docker run --name xx --detach --entrypoint sleep "$image" infinity
docker cp xx:/opt/appsmith/server/pg "$target/pg"
docker cp xx:/opt/appsmith/info.json "$target/pg/source-info.json"
docker rm --force xx
docker image rm "$image"