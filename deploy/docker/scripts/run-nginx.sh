#!/bin/bash

set -o errexit
set -o nounset
set -o pipefail
set -o xtrace

http_conf="/opt/appsmith/templates/nginx-app-http.conf.template.sh"
https_conf="/opt/appsmith/templates/nginx-app-https.conf.template.sh"

APP_TEMPLATE="$http_conf"

# Check exist certificate with given custom domain
if [[ -n ${APPSMITH_CUSTOM_DOMAIN:-} ]]; then
	APP_TEMPLATE="$https_conf"
	if ! [[ -e "/etc/letsencrypt/live/$APPSMITH_CUSTOM_DOMAIN" ]]; then
		source "/opt/appsmith/init_ssl_cert.sh"
		if ! init_ssl_cert "$APPSMITH_CUSTOM_DOMAIN"; then
			echo "Status code from init_ssl_cert is $?"
			APP_TEMPLATE="$http_conf"
		fi
	fi
fi

bash "$APP_TEMPLATE" "${APPSMITH_CUSTOM_DOMAIN:-}" > /etc/nginx/sites-available/default

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

exec nginx -g "daemon off;"
