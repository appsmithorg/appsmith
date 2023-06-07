#!/usr/bin/env bash

set -o errexit

cd "$(dirname "$0")"
./build.sh

set -o allexport
source .env
exec node --require source-map-support/register dist/server.js
