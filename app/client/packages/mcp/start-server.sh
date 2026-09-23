#!/usr/bin/env bash

set -o errexit

cd "$(dirname "$0")"
./build.sh

if [[ -f .env ]]; then
  set -o allexport
  source .env
  set +o allexport
fi

exec node --enable-source-maps dist/bundle/server.js
