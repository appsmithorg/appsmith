#!/usr/bin/env bash

set -o errexit

cd "$(dirname "$0")"
yarn install --frozen-lockfile
npx tsc && npx tsc-alias
cp -r node_modules ./dist
