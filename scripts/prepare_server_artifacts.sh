#!/bin/bash -eux

cd "$(git rev-parse --show-toplevel)"

if [[ -z "${EDITION-}" ]]; then
  export EDITION=ce
  if [[ "$(git remote get-url origin)" == *appsmithorg/appsmith-ee.git ]]; then
    export EDITION=ee
  fi
fi

MONGO_TAG="${MONGO_TAG-release}"
echo "Will be copying server artifacts from appsmith-$EDITION:$MONGO_TAG"

target="deploy/docker/fs/opt/appsmith/server"
mkdir -p "$target"
rm -rf "$target"/{pg,mongo}

cp -r "app/server/dist" "$target/pg"
mv "$target/pg"/server-*.jar "$target/pg/server.jar"

# Grab MongoDB server artifacts from that Docker image.
docker run --name xx -d --rm --entrypoint sleep "appsmith/appsmith-$EDITION:$MONGO_TAG" infinity
docker cp xx:/opt/appsmith/backend "$target/mongo"
docker cp xx:/opt/appsmith/info.json "$target/mongo/source-info.json"
docker rm --force xx