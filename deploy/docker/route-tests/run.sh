#!/usr/bin/env bash

set -o errexit
set -o nounset

loc="$(dirname "$0")"
docker build -f "$loc/Dockerfile" --tag ar "$loc/.."
docker run \
  --name ar \
  --rm \
  -it \
  --hostname ar \
  -e OPEN_SHELL=${OPEN_SHELL-} \
  --volume "$loc/../fs/opt/appsmith/caddy-reconfigure.mjs:/caddy-reconfigure.mjs:ro" \
  --volume "$loc:/code:ro" \
  ar
