#!/usr/bin/env bash

set -o errexit
now="$(date '+%s')"
echo "export const VERSION = '$now'" > src/version.js
cd "$(dirname "$0")"
yarn install --frozen-lockfile
npx tsc
