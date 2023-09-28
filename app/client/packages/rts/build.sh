#!/usr/bin/env bash

set -o errexit

cd "$(dirname "$0")"

root="$(git rev-parse --show-toplevel)"

yarn install --immutable
yarn run tsc --noEmit

rm -rf dist
exec "$root/app/client/node_modules/.bin/esbuild" src/server.ts \
  --bundle \
  --minify \
  --sourcemap \
  --platform=node \
  --target="$(node --version | sed s/v/node/)" \
  --outdir=dist/bundle \
  --external:dtrace-provider
