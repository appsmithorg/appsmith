#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail
#set -o xtrace

new-spec() {
  echo "-----------" "$@" "-----------"
  unset APPSMITH_CUSTOM_DOMAIN
  mkdir -p /appsmith-stacks/ssl
  find /appsmith-stacks/ssl -type f -delete
}

reload-caddy() {
  sed -i 's/127.0.0.1:{args\[0]}/127.0.0.1:5050/' "$TMP/Caddyfile"
  /opt/caddy/caddy fmt --overwrite "$TMP/Caddyfile"
  /opt/caddy/caddy reload --config "$TMP/Caddyfile"
  sleep 1
}

run-hurl() {
  /opt/hurl/hurl --test \
    --resolve local.com:80:127.0.0.1 \
    --resolve custom-domain.com:80:127.0.0.1 \
    --resolve custom-domain.com:443:127.0.0.1 \
    "$@"
}

if [[ "${OPEN_SHELL-}" == 1 ]]; then
  # Open shell for debugging after this script is done.
  trap bash EXIT
fi

echo
echo "caddy version: $(/opt/caddy/caddy --version)"
echo "hurl version: $(/opt/hurl/hurl --version)"
echo "mkcert version: $(/opt/mkcert --version)"
echo

export TMP=/tmp/appsmith
export WWW_PATH="$TMP/www"

mkdir -p "$WWW_PATH"
echo -n 'index.html body' > "$WWW_PATH/index.html"

# Start echo server
(
  export XDG_DATA_HOME="$TMP/echo-data"
  export XDG_CONFIG_HOME="$TMP/echo-conf"
  mkdir -p "$XDG_DATA_HOME" "$XDG_CONFIG_HOME"
  /opt/caddy/caddy start --config echo.caddyfile --adapter caddyfile >> "$TMP/echo-caddy.log" 2>&1
)

# Start Caddy for use with our config to test
echo localhost > "$TMP/Caddyfile"
/opt/caddy/caddy start --config "$TMP/Caddyfile" >> "$TMP/caddy.log" 2>&1

sleep 1


new-spec "Spec 1: With no custom domain"
node /caddy-reconfigure.mjs
reload-caddy
run-hurl common/*.hurl


new-spec "Spec 2: With a custom domain, cert obtained (because of internal CA)"
export APPSMITH_CUSTOM_DOMAIN=custom-domain.com
node /caddy-reconfigure.mjs
#sed -i '2i acme_ca https://acme-staging-v02.api.letsencrypt.org/directory' "$TMP/Caddyfile"
sed -i '/^https:\/\//a tls internal' "$TMP/Caddyfile"
reload-caddy
run-hurl common/*.hurl common-https/*.hurl spec-2/*.hurl


new-spec "Spec 3: With a custom domain, certs given in ssl folder"
export APPSMITH_CUSTOM_DOMAIN=custom-domain.com
/opt/mkcert -cert-file "/appsmith-stacks/ssl/fullchain.pem" -key-file "/appsmith-stacks/ssl/privkey.pem" "$APPSMITH_CUSTOM_DOMAIN"
node /caddy-reconfigure.mjs
reload-caddy
run-hurl common/*.hurl spec-3/*.hurl
