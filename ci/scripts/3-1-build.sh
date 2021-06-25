#!/bin/bash

# Build phase script for units node in the main build graph.

set -o errexit
set -o xtrace

cd "$CODEBUILD_SRC_DIR/app/client"
npm install -g yarn
yarn install --frozen-lockfile

# TODO: See if `--ci` is useful when running jest. <https://archive.jestjs.io/docs/en/24.x/cli>.
REACT_APP_ENVIRONMENT=PRODUCTION npx jest -b --no-cache --coverage --collectCoverage=true --coverageDirectory='../../' --coverageReporters='json-summary'

wget -O mongod.tgz https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2004-4.4.6.tgz
tar -xaf mongodb.tgz
mkdir -p /data/db
mongodb-linux-x86_64-ubuntu2004-4.4.6/bin/mongod &
export APPSMITH_MONGODB_URI="mongodb://localhost:27017/appsmith"

if [[ -z $APPSMITH_MONGODB_URI ]]; then
	docker run -d --name mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=root mongo
	export APPSMITH_MONGODB_URI="mongodb://root:root@localhost:27017/appsmith?authSource=admin"
fi

if [[ -z $APPSMITH_REDIS_URL ]]; then
	docker run -d --name redis -p 6379:6379 redis:6
	export APPSMITH_REDIS_URL="redis://localhost:6379"
fi

export APPSMITH_ENCRYPTION_SALT=ci-salt-is-white-like-radish
export APPSMITH_ENCRYPTION_PASSWORD=ci-password-is-red-like-carrot

export APPSMITH_CLOUD_SERVICES_BASE_URL=
export APPSMITH_IS_SELF_HOSTED=false

cd "$CODEBUILD_SRC_DIR/app/server"
./build.sh --batch-mode  # TODO: This runs `mvn package`, instead, run a command that's focused on tests instead.
