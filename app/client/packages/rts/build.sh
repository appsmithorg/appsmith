#!/usr/bin/env bash

set -o errexit

cd "$(dirname "$0")"

root="$(git rev-parse --show-toplevel)"

yarn install --immutable
yarn run tsc --noEmit

rm -rf dist
"$root"/app/client/node_modules/.bin/esbuild src/server.ts \
  --bundle \
  --minify \
  --sourcemap \
  --platform=node \
  --target="$(node --version | sed s/v/node/)" \
  --outdir=dist \
  --external:dtrace-provider

cp -vr \
  dist \
  "$root"/deploy/docker/fs/opt/appsmith/rts
