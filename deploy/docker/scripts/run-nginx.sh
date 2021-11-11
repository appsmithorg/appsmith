#!/bin/bash

NGINX_SSL_CMNT="#"
ENV_PATH="/appsmith-stacks/configuration/docker.env"
echo 'Load environment configuration'
set -o allexport
. "$ENV_PATH"
set +o allexport

if [[ -n $APPSMITH_CUSTOM_DOMAIN ]]; then    
  NGINX_SSL_CMNT=""
fi

echo "Re-generating nginx config template"
bash "/opt/appsmith/templates/nginx_app.conf.sh" "$NGINX_SSL_CMNT" "$APPSMITH_CUSTOM_DOMAIN" >"/etc/nginx/conf.d/nginx_app.conf.template"

echo "Generating nginx configuration"
cat /etc/nginx/conf.d/nginx_app.conf.template | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z0-9_]+'))" | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' >/etc/nginx/sites-available/default

# Check exist certificate with given custom domain
if ! [[ -e "/etc/letsencrypt/live/$APPSMITH_CUSTOM_DOMAIN" ]] && [[ -n $APPSMITH_CUSTOM_DOMAIN ]]; then
  source "/opt/appsmith/init_ssl_cert.sh"
  init_ssl_cert "$APPSMITH_CUSTOM_DOMAIN"
fi

exec nginx -g "daemon off;"