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

python3 -c '
from pathlib import Path
import re
import os
index_path = Path("/opt/appsmith/editor/index.html")
content = re.sub(
	r"\b__(APPSMITH_[A-Z0-9_]+?)__\b",
	lambda match: os.environ.get(match.group(1), match.group(0)),
	index_path.read_text(),
)
index_path.write_text(content)
'

exec nginx -g "daemon off;"
