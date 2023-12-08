#!/bin/bash

set -o errexit
set -o nounset
set -o pipefail

if [[ -z "${APPSMITH_DISABLE_IFRAME_WIDGET_SANDBOX-}" ]]; then
  # For backwards compatibility, if this is not set to anything, we default to no sandbox for iframe widgets.
  export APPSMITH_DISABLE_IFRAME_WIDGET_SANDBOX="true"
fi

apply-env-vars() {
  original="$1"
  served="$2"
  node -e '
  const fs = require("fs")
  try {
    const info = JSON.parse(fs.readFileSync("/opt/appsmith/info.json", "utf8"))
    process.env.APPSMITH_VERSION_ID = info.version || ""
    process.env.APPSMITH_VERSION_RELEASE_DATE = info.imageBuiltAt || ""
  } catch {}
  const content = fs.readFileSync("'"$original"'", "utf8").replace(
    /\b__(APPSMITH_[A-Z0-9_]+)__\b/g,
    (placeholder, name) => (process.env[name] || "")
  )
  fs.writeFileSync("'"$served"'", content)
  '
  pushd "$(dirname "$served")"
  gzip --keep --force "$(basename "$served")"
  popd
}

apply-env-vars /opt/appsmith/editor/index.html "$WWW_PATH/index.html"

node caddy-reconfigure.mjs

# Caddy may already be running for the loading page.
/opt/caddy/caddy stop --config "$TMP/Caddyfile" || true

exec /opt/caddy/caddy run --config "$TMP/Caddyfile"
