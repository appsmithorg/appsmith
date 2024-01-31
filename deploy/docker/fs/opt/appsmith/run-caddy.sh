#!/bin/bash

set -o errexit
set -o nounset
set -o pipefail

if [[ -z "${APPSMITH_DISABLE_IFRAME_WIDGET_SANDBOX-}" ]]; then
  # For backwards compatibility, if this is not set to anything, we default to no sandbox for iframe widgets.
  export APPSMITH_DISABLE_IFRAME_WIDGET_SANDBOX="true"
fi

node caddy-reconfigure.mjs

pushd "$(dirname "$WWW_PATH/index.html")"
gzip --keep --force "$(basename "$WWW_PATH/index.html")"
popd

# Caddy may already be running for the loading page.
/opt/caddy/caddy stop --config "$TMP/Caddyfile" || true

exec /opt/caddy/caddy run --config "$TMP/Caddyfile"
