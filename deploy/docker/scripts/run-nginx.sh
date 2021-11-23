#!/bin/bash

NGINX_SSL_CMNT="#"
ENV_PATH="/appsmith-stacks/configuration/docker.env"
echo 'Load environment configuration'
set -o allexport
. "$ENV_PATH"
set +o allexport

TEMPLATE_DIR="/opt/appsmith/templates"
APP_TEMPLATE="$TEMPLATE_DIR/nginx-app-http.conf.template.sh"

# Check exist certificate with given custom domain
if [[ -n $APPSMITH_CUSTOM_DOMAIN ]]; then
  APP_TEMPLATE="$TEMPLATE_DIR/nginx-app-https.conf.template.sh"
  if ! [[ -e "/etc/letsencrypt/live/$APPSMITH_CUSTOM_DOMAIN" ]]; then
    source "/opt/appsmith/init_ssl_cert.sh"
    init_ssl_cert "$APPSMITH_CUSTOM_DOMAIN"
  fi
fi

echo "Re-generating nginx config template"
bash "$APP_TEMPLATE" "$APPSMITH_CUSTOM_DOMAIN" >"/etc/nginx/conf.d/nginx_app.conf.template"

echo "Generating nginx configuration"
cat /etc/nginx/conf.d/nginx_app.conf.template | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z0-9_]+'))" | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' >/etc/nginx/sites-available/default

exec nginx -g "daemon off;"