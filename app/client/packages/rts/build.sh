#!/usr/bin/env bash

set -o errexit

cd "$(dirname "$0")"

yarn install --immutable
yarn run tsc --noEmit

rm -rf dist
node build.js

# EE specific actions
mkdir -pv dist/config
cp -v src/scim/config/plugin-scim.json dist/config/server.json
cp -v src/workflowProxy/services/workflows.js dist/bundle/workflows.js