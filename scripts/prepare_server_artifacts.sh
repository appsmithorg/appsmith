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

# Grab other server artifacts from GitHub Workflow Artifacts
runs_data="$(
  gh api 'repos/{owner}/{repo}/actions/workflows/test-build-docker-image.yml/runs?status=success&per_page=1&exclude_pull_requests=true&branch=release'
)"
artifact_data="$(
  gh api "$(echo "$runs_data" | jq -r '.workflow_runs[0].artifacts_url')?name=server-build" \
    | jq '.artifacts[0]'
)"
curl --location \
  --output server-build.zip \
  --oauth2-bearer "$(gh auth token)" \
  "$(echo "$artifact_data" | jq -r .archive_download_url)"
unzip server-build.zip
rm server-build.zip
mv server-*.jar server.jar
mv server.jar plugins "$target/mongo"
echo "$artifact_data" | jq | tee "$target/mongo/source-artifact.json"
