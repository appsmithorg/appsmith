#!/usr/bin/env bash

set -o errexit

cd "$(dirname "$0")"

yarn install --immutable
yarn run tsc --noEmit

rm -rf dist/
esbuild src/server.ts \
  --bundle \
  --minify \
  --sourcemap \
  --platform=node \
  --target="$(node --version | sed s/v/node/)" \
  --outdir=dist \
  --external:dtrace-provider

cp -vr \
  dist \
  "$(git rev-parse --show-toplevel)"/deploy/docker/fs/opt/appsmith/rts
