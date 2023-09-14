#!/usr/bin/env bash

set -o errexit

cd "$(dirname "$0")"
rm -rf dist/

yarn install --immutable
yarn run tsc --noEmit

esbuild src/server.ts --bundle --minify --sourcemap --platform=node --target="$(node --version | sed s/v/node/)" --outfile=dist/rts.js

cp -r dist "$(git rev-parse --show-toplevel)"/deploy/docker/fs/opt/appsmith/rts
