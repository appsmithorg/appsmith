#!/usr/bin/env bash

# Change to the parent directory of the directory containing this script.
cd "$(cd "$(dirname "$0")" && pwd)/.."

# Ref: <https://stackoverflow.com/a/30969768/151048>.
set -o allexport
source envs/dev.env

exec java -jar dist/server-*.jar
