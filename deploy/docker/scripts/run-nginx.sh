#!/bin/bash

set -o errexit
set -o nounset
set -o pipefail
set -o xtrace

http_conf="/opt/appsmith/templates/nginx-app-http.conf.template.sh"
https_conf="/opt/appsmith/templates/nginx-app-https.conf.template.sh"

APP_TEMPLATE="$http_conf"

# Check exist certificate with given custom domain
if [[ -n $APPSMITH_CUSTOM_DOMAIN ]]; then
	APP_TEMPLATE="$https_conf"
	if ! [[ -e "/etc/letsencrypt/live/$APPSMITH_CUSTOM_DOMAIN" ]]; then
		source "/opt/appsmith/init_ssl_cert.sh"
		if ! init_ssl_cert "$APPSMITH_CUSTOM_DOMAIN"; then
			echo "Status code from init_ssl_cert is $?"
			APP_TEMPLATE="$http_conf"
		fi
	fi
fi

bash "$APP_TEMPLATE" "$APPSMITH_CUSTOM_DOMAIN" > /etc/nginx/sites-available/default

node -e '
const fs = require("fs")
const indexPath = "/opt/appsmith/editor/index.html"
const content = fs.readFileSync(indexPath, "utf8").replace(
	/\b__(APPSMITH_[A-Z0-9_]+)__\b/g,
	(placeholder, name) => (process.env[name] || placeholder)
)
fs.writeFileSync(indexPath, content)
'

exec nginx -g "daemon off;"
