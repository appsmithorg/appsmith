#!/usr/bin/env bash

set -o errexit
set -o nounset

cd "$(dirname "$0")"

docker build -f Dockerfile --tag ar ..

declare -a args
args+=(--hostname ar)

if [[ "${CI-}" != true ]]; then
  args+=(--interactive --tty)
fi

docker run \
  --name ar \
  --rm \
  "${args[@]}" \
  -e OPEN_SHELL="${OPEN_SHELL-}" \
  --volume "$(dirname "$PWD")/fs/opt/appsmith/caddy-reconfigure.mjs:/caddy-reconfigure.mjs:ro" \
  --volume ".:/code:ro" \
  ar
