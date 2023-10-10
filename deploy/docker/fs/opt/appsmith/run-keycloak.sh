#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset
set -o noglob

declare -a extra_args

if [[ -f "$TMP/cacerts" ]]; then
  extra_args+=(--spi-truststore-file-file="$TMP/cacerts" --spi-truststore-file-password=changeit)
fi

exec /opt/keycloak/bin/kc.sh \
  start \
  "${extra_args[@]}" \
  --hostname-strict=false \
  --hostname-path=/auth \
  --http-port=8081 \
  --proxy=edge \
  --http-relative-path=/auth
