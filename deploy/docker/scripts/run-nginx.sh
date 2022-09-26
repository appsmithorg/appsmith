#!/bin/bash

set -o errexit
set -o nounset
set -o pipefail
set -o xtrace

http_conf="/opt/appsmith/templates/nginx-app-http.conf.template.sh"
https_conf="/opt/appsmith/templates/nginx-app-https.conf.template.sh"
ssl_conf_path="/appsmith-stacks/data/certificate/conf"

APP_TEMPLATE="$http_conf"

mkdir -pv "$ssl_conf_path"

cat <<EOF > "$ssl_conf_path/options-ssl-nginx.conf"
# This file contains important security parameters. If you modify this file
# manually, Certbot will be unable to automatically provide future security
# updates. Instead, Certbot will print and log an error message with a path to
# the up-to-date file that you will need to refer to when manually updating
# this file.

ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets off;

ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;

ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
EOF

cat <<EOF > "$ssl_conf_path/ssl-dhparams.pem"
-----BEGIN DH PARAMETERS-----
MIIBCAKCAQEA//////////+t+FRYortKmq/cViAnPTzx2LnFg84tNpWp4TZBFGQz
+8yTnc4kmz75fS/jY2MMddj2gbICrsRhetPfHtXV/WVhJDP1H18GbtCFY2VVPe0a
87VXE15/V8k1mE8McODmi3fipona8+/och3xWKE2rec1MKzKT0g6eXq8CrGCsyT7
YdEIqUuyyOP7uWrat2DX9GgdT0Kj3jlN9K5W7edjcrsZCwenyO4KbXCeAvzhzffi
7MA0BM0oNC9hkXL+nOmFg/+OTxIy7vKBg8P+OxtMb61zO7X8vC7CIAXFjvGDfRaD
ssbzSibBsu/6iGtCOGEoXJf//////////wIBAg==
-----END DH PARAMETERS-----
EOF

if [[ -z "${APPSMITH_ALLOWED_FRAME_ANCESTORS-}" ]]; then
	# https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors
	export APPSMITH_ALLOWED_FRAME_ANCESTORS="'self'"
else
	# Remove any extra rules that may be present in the frame ancestors value. This is to prevent this env variable from
	# being used to inject more rules to the CSP header. If needed, that should be supported/solved separately.
	export APPSMITH_ALLOWED_FRAME_ANCESTORS="${APPSMITH_ALLOWED_FRAME_ANCESTORS%;*}"
fi

# Check exist certificate with given custom domain
# Heroku not support for custom domain, only generate HTTP config if deploying on Heroku
if [[ -n ${APPSMITH_CUSTOM_DOMAIN-} ]] && [[ -z ${DYNO-} ]]; then
  APP_TEMPLATE="$https_conf"
  if ! [[ -e "/etc/letsencrypt/live/$APPSMITH_CUSTOM_DOMAIN" ]]; then
    source "/opt/appsmith/init_ssl_cert.sh"
    if ! init_ssl_cert "$APPSMITH_CUSTOM_DOMAIN"; then
      echo "Status code from init_ssl_cert is $?"
      APP_TEMPLATE="$http_conf"
    fi
  fi
fi

bash "$APP_TEMPLATE" "${APPSMITH_CUSTOM_DOMAIN-}" > /etc/nginx/sites-available/default

index_html_served=/opt/appsmith/editor/index.html
index_html_original=/opt/appsmith/index.html.original
if [[ ! -f $index_html_original ]]; then
  cp -v "$index_html_served" "$index_html_original"
fi

node -e '
const fs = require("fs")
const content = fs.readFileSync("'"$index_html_original"'", "utf8").replace(
  /\b__(APPSMITH_[A-Z0-9_]+)__\b/g,
  (placeholder, name) => (process.env[name] || "")
)
fs.writeFileSync("'"$index_html_served"'", content)
'

exec nginx -g "daemon off;error_log stderr info;"
