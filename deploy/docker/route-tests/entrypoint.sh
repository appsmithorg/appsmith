#!/bin/bash

set -o errexit
set -o nounset
set -o pipefail

new-spec() {
  echo "-----------" "$@" "-----------"

  # Unset influencing state
  unset APPSMITH_CUSTOM_DOMAIN APPSMITH_ALLOWED_FRAME_ANCESTORS APPSMITH_RATE_LIMIT APPSMITH_SERVER_TIMEOUT

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
  # Default value for the frame_ancestors variable; specs override it by
  # passing their own --variable frame_ancestors=... (the last definition wins).
  hurl --test \
    --variable "frame_ancestors=$default_frame_ancestors" \
    --resolve local.com:80:127.0.0.1 \
    --resolve custom-domain.com:80:127.0.0.1 \
    --resolve custom-domain.com:443:127.0.0.1 \
    "$@"
}

fail() {
  echo "FAILED: $*" >&2
  exit 1
}

# Print the body of the named snippet in the rendered Caddyfile.
snippet-body() {
  awk -v start="($1) {" '$0 == start { found = 1; next } found && /^}/ { exit } found' "$TMP/Caddyfile"
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
export _APPSMITH_CADDY=caddy

# Fake files needed by the caddy-reconfigure script
mkdir -p "$WWW_PATH" /opt/appsmith/editor
echo -n 'index.html body, this will be replaced' > "$WWW_PATH/index.html"
echo '{}' > /opt/appsmith/info.json
echo -n 'actual index.html body' > /opt/appsmith/editor/index.html
echo -n 'actual 404.html body' > /opt/appsmith/editor/404.html
# A file large enough to exceed the encode directive's minimum length, so Caddy compresses it.
mkdir -p /opt/appsmith/editor/static
printf 'a%.0s' {1..4096} > /opt/appsmith/editor/static/test-encoding.txt
mkcert -install

# Start echo server
XDG_DATA_HOME="$TMP/echo-data" \
  XDG_CONFIG_HOME="$TMP/echo-conf" \
  caddy start --config echo.caddyfile --adapter caddyfile \
  >> "$TMP/echo-caddy.log" 2>&1

# Start the slow upstream that the echo server forwards */__slow paths to
node slow-upstream.mjs >> "$TMP/slow-upstream.log" 2>&1 &

# Start Caddy for use with our config to test. The admin endpoint must be the
# same unix socket that the generated Caddyfile declares, so that reloads can
# reach this instance.
printf '{\n\tadmin unix/%s/caddy.sock\n}\n' "$TMP" > "$TMP/bootstrap.caddyfile"
caddy start --config "$TMP/bootstrap.caddyfile" --adapter caddyfile >> "$TMP/caddy.log" 2>&1

sleep 1

# Default values for Hurl variables
default_frame_ancestors="'self'"


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


new-spec "Spec 8: Frame ancestors value with extra CSP directives"
export APPSMITH_ALLOWED_FRAME_ANCESTORS="something.com; script-src something more not allowed"
node /caddy-reconfigure.mjs
reload-caddy
run-hurl --variable frame_ancestors="something.com" \
  common/*.hurl


new-spec "Spec 9: Rate limit counts backend paths at 1x and hashed static assets at 10x"
export APPSMITH_RATE_LIMIT=5
node /caddy-reconfigure.mjs
reload-caddy
# Let the window from earlier specs' requests expire before counting.
sleep 2
run-hurl rate-limit/*.hurl


new-spec "Spec 10: Server timeout unset puts no timeout on any upstream"
node /caddy-reconfigure.mjs
if grep -qE 'response_header_timeout|read_timeout' "$TMP/Caddyfile"; then
  fail "a proxy timeout was rendered with APPSMITH_SERVER_TIMEOUT unset"
fi
reload-caddy
run-hurl server-timeout/unset.hurl


new-spec "Spec 11: Server timeout caps backend requests only"
export APPSMITH_SERVER_TIMEOUT=2
node /caddy-reconfigure.mjs
[[ "$(grep -cE 'response_header_timeout' "$TMP/Caddyfile")" == 1 ]] \
  || fail "expected exactly one response_header_timeout"
grep -qE 'response_header_timeout[[:space:]]+2s$' <<< "$(snippet-body backend_reverse_proxy)" \
  || fail "backend_reverse_proxy snippet does not set response_header_timeout 2s"
! grep -qE 'read_timeout' "$TMP/Caddyfile" || fail "read_timeout must not be rendered"
! grep -qE 'timeout' <<< "$(snippet-body reverse_proxy)" || fail "plain reverse_proxy snippet must have no timeout"
grep -qE 'import backend_reverse_proxy 8080$' "$TMP/Caddyfile" || fail "@backend does not use backend_reverse_proxy"
grep -qE 'import reverse_proxy 8091$' "$TMP/Caddyfile" || fail "/rts/* does not use the plain snippet"
grep -qE 'import reverse_proxy 8092$' "$TMP/Caddyfile" || fail "/mcp routes do not use the plain snippet"
! grep -qE 'import backend_reverse_proxy (8091|8092)$' "$TMP/Caddyfile" || fail "/rts/* or /mcp routes are capped"
reload-caddy
run-hurl server-timeout/capped.hurl


new-spec "Spec 12: Invalid server timeout values are ignored with a warning"
# 9223372037 s overflows Go's time.Duration; 25 digits would render in exponent form.
for value in abc 0 -5 5s 1.5 " " 86401 9223372037 1234567890123456789012345; do
  APPSMITH_SERVER_TIMEOUT="$value" node /caddy-reconfigure.mjs 2> "$TMP/reconfigure.err" \
    || fail "caddy-reconfigure.mjs failed for APPSMITH_SERVER_TIMEOUT='$value'"
  ! grep -qE 'response_header_timeout|read_timeout' "$TMP/Caddyfile" \
    || fail "a proxy timeout was rendered for APPSMITH_SERVER_TIMEOUT='$value'"
  [[ "$(grep -c 'APPSMITH_SERVER_TIMEOUT' "$TMP/reconfigure.err")" == 1 ]] \
    || fail "expected one warning for APPSMITH_SERVER_TIMEOUT='$value', got: $(cat "$TMP/reconfigure.err")"
done
APPSMITH_SERVER_TIMEOUT="" node /caddy-reconfigure.mjs 2> "$TMP/reconfigure.err"
! grep -qE 'response_header_timeout|read_timeout' "$TMP/Caddyfile" || fail "a proxy timeout was rendered for an empty value"
! grep -q 'APPSMITH_SERVER_TIMEOUT' "$TMP/reconfigure.err" || fail "an empty value must not warn"
APPSMITH_SERVER_TIMEOUT=" 30 " node /caddy-reconfigure.mjs 2> "$TMP/reconfigure.err"
grep -qE 'response_header_timeout[[:space:]]+30s$' <<< "$(snippet-body backend_reverse_proxy)" \
  || fail "a value with surrounding whitespace was not accepted"
! grep -q 'APPSMITH_SERVER_TIMEOUT' "$TMP/reconfigure.err" || fail "a valid value with surrounding whitespace must not warn"
APPSMITH_SERVER_TIMEOUT=86400 node /caddy-reconfigure.mjs 2> "$TMP/reconfigure.err"
grep -qE 'response_header_timeout[[:space:]]+86400s$' <<< "$(snippet-body backend_reverse_proxy)" \
  || fail "the maximum value 86400 was not accepted"
! grep -q 'APPSMITH_SERVER_TIMEOUT' "$TMP/reconfigure.err" || fail "the maximum value must not warn"
echo "Spec 12 passed"
