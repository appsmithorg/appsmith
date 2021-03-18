#!/usr/bin/env bash

cd "$(dirname "$0")"
set -o allexport
source .env
exec node server.js
