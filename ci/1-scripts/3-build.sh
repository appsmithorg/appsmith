#!/bin/bash

# Build phase script for units node in the main build graph.

set -o errexit
set -o xtrace

cd "$CODEBUILD_SRC_DIR/app/client"
npm install -g yarn
yarn install --frozen-lockfile

# TODO: See if `--ci` is useful when running jest. <https://archive.jestjs.io/docs/en/24.x/cli>.
REACT_APP_ENVIRONMENT=PRODUCTION npx jest -b --no-cache --coverage --collectCoverage=true --coverageDirectory='../../' --coverageReporters='json-summary'

wget --quiet -O mongodb.tgz https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2004-4.4.6.tgz
tar -xaf mongodb.tgz
mkdir -p /data/db
# Starting background processes: <https://docs.aws.amazon.com/codebuild/latest/userguide/build-env-ref-background-tasks.html>.
nohup mongodb-linux-x86_64-ubuntu2004-4.4.6/bin/mongod & disown $!
export APPSMITH_MONGODB_URI="mongodb://localhost:27017/appsmith"

export APPSMITH_ENCRYPTION_SALT=ci-salt-is-white-like-radish
export APPSMITH_ENCRYPTION_PASSWORD=ci-password-is-red-like-carrot

export APPSMITH_CLOUD_SERVICES_BASE_URL=
export APPSMITH_IS_SELF_HOSTED=false

cd "$CODEBUILD_SRC_DIR/app/server"
./build.sh --batch-mode  # TODO: This runs `mvn package`, instead, run a command that's focused on tests instead.
