#!/bin/bash

set -o errexit
set -o nounset
set -o pipefail

new-spec() {
  echo "-----------" "$@" "-----------"

  # Unset influencing state
  unset APPSMITH_CUSTOM_DOMAIN APPSMITH_ALLOWED_FRAME_ANCESTORS

  # Clean custom certificates
  mkdir -p /appsmith-stacks/ssl
  find /appsmith-stacks/ssl -type f -delete
}

reload-caddy() {
  sed -i 's/127.0.0.1:{args\[0]}/127.0.0.1:5050/' "$TMP/Caddyfile"
  caddy fmt --overwrite "$TMP/Caddyfile"
  caddy reload --config "$TMP/Caddyfile"
  sleep 1
}

run-hurl() {
  hurl --test \
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
echo "caddy version: $(caddy --version)"
echo "hurl version: $(hurl --version)"
echo "mkcert version: $(mkcert --version)"
echo

export TMP=/tmp/appsmith
export WWW_PATH="$TMP/www"

# Fake files needed by the caddy-reconfigure script
mkdir -p "$WWW_PATH" /opt/appsmith/editor
echo -n 'index.html body, this will be replaced' > "$WWW_PATH/index.html"
echo '{}' > /opt/appsmith/info.json
echo -n 'actual index.html body' > /opt/appsmith/editor/index.html
mkcert -install

# Start echo server
XDG_DATA_HOME="$TMP/echo-data" \
  XDG_CONFIG_HOME="$TMP/echo-conf" \
  caddy start --config echo.caddyfile --adapter caddyfile \
  >> "$TMP/echo-caddy.log" 2>&1

# Start Caddy for use with our config to test
caddy start >> "$TMP/caddy.log" 2>&1

sleep 1

# Default values for Hurl variables
export HURL_frame_ancestors="'self'"


# Run tests, scenario by scenario
new-spec "Spec 1: With no custom domain and no frame ancestors"
node /caddy-reconfigure.mjs
reload-caddy
run-hurl common/*.hurl


new-spec "Spec 2: With a custom domain, cert obtained (because of internal CA)"
export APPSMITH_CUSTOM_DOMAIN=custom-domain.com
node /caddy-reconfigure.mjs
#sed -i '2i acme_ca https://acme-staging-v02.api.letsencrypt.org/directory' "$TMP/Caddyfile"
# The domain being present is a necceary thing here, since otherwise Caddy won't know what domain to provision a cert for.
sed -i '/https:\/\/'"$APPSMITH_CUSTOM_DOMAIN"' {$/a tls internal' "$TMP/Caddyfile"
reload-caddy
run-hurl --variable ca_issuer="CN = Caddy Local Authority - ECC Intermediate" \
  common/*.hurl common-https/*.hurl


new-spec "Spec 3: With a custom domain, certs given in ssl folder"
export APPSMITH_CUSTOM_DOMAIN=custom-domain.com
mkcert -cert-file "/appsmith-stacks/ssl/fullchain.pem" -key-file "/appsmith-stacks/ssl/privkey.pem" "$APPSMITH_CUSTOM_DOMAIN"
node /caddy-reconfigure.mjs
reload-caddy
run-hurl --variable ca_issuer="O = mkcert development CA" \
  common/*.hurl common-https/*.hurl


new-spec "Spec 4: No custom domain, but certs present in ssl folder"
mkcert -cert-file "/appsmith-stacks/ssl/fullchain.pem" -key-file "/appsmith-stacks/ssl/privkey.pem" random-domain.com
node /caddy-reconfigure.mjs
reload-caddy
run-hurl common/*.hurl


new-spec "Spec 5: Empty custom domain, but certs present in ssl folder"
export APPSMITH_CUSTOM_DOMAIN=""
mkcert -cert-file "/appsmith-stacks/ssl/fullchain.pem" -key-file "/appsmith-stacks/ssl/privkey.pem" random-domain.com
node /caddy-reconfigure.mjs
reload-caddy
run-hurl common/*.hurl


new-spec "Spec 6: Custom frame ancestors"
export APPSMITH_ALLOWED_FRAME_ANCESTORS="something.com another.com"
node /caddy-reconfigure.mjs
reload-caddy
run-hurl --variable frame_ancestors="something.com another.com" \
  common/*.hurl


new-spec "Spec 7: Empty frame ancestors"
export APPSMITH_ALLOWED_FRAME_ANCESTORS=""
node /caddy-reconfigure.mjs
reload-caddy
run-hurl common/*.hurl


new-spec "Spec 7: Frame ancestors value with extra CSP directives"
export APPSMITH_ALLOWED_FRAME_ANCESTORS="something.com; script-src something more not allowed"
node /caddy-reconfigure.mjs
reload-caddy
run-hurl --variable frame_ancestors="something.com" \
  common/*.hurl
