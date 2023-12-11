#!/usr/bin/env bash

set -o errexit

cd "$(dirname "$0")"

yarn install --immutable
yarn run tsc --noEmit

rm -rf dist
node build.js