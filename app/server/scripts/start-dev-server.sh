#!/usr/bin/env bash

# Change to the parent directory of the directory containing this script.
cd "$(cd "$(dirname "$0")" && pwd)/.."

# Ref: <https://stackoverflow.com/a/30969768/151048>.
if [[ -f .env ]]; then
  echo "Found a .env file, loading environment variables from that file."
  set -o allexport
  source .env
fi

(cd dist && exec java -jar server-*.jar)
