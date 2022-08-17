#!/usr/bin/env bash

set -o errexit

cd "$(dirname "$0")"
rm -rf dist
yarn install --frozen-lockfile
npx tsc
