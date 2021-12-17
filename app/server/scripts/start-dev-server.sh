#!/usr/bin/env bash

# Change to the parent directory of the directory containing this script.
cd "$(cd "$(dirname "$0")" && pwd)/.."

# Ref: <https://stackoverflow.com/a/30969768/151048>.
if [[ -f .env ]]; then
  echo "Found a .env file, loading environment variables from that file."
  set -o allexport
  source .env
fi

source ../util/is_wsl.sh
if [ $IS_WSL ]; then
  _JAVA_OPTIONS="-Djava.net.preferIPv4Stack=true $_JAVA_OPTIONS"
fi

(cd dist && exec java -jar server-*.jar)
