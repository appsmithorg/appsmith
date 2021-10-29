#!/bin/bash

init_ssl_cert() {
  echo "Start Nginx to verify certificate"
  nginx
  local domain="$1"
  NGINX_SSL_CMNT=""

  local rsa_key_size=4096
  local data_path="/appsmith-stacks/data/certificate"

  mkdir -p "$data_path" "$data_path"/{conf,www}

  if ! [[ -e "$data_path/conf/options-ssl-nginx.conf" && -e "$data_path/conf/ssl-dhparams.pem" ]]; then
    echo "Downloading recommended TLS parameters..."
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf >"$data_path/conf/options-ssl-nginx.conf"
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem >"$data_path/conf/ssl-dhparams.pem"
    echo
  fi

  echo "Re-generating nginx config template with domain"
  bash "/opt/appsmith/templates/nginx_app.conf.sh" "$NGINX_SSL_CMNT" "$APPSMITH_CUSTOM_DOMAIN" >"/etc/nginx/conf.d/nginx_app.conf.template"

  echo "Generating nginx configuration"
  cat /etc/nginx/conf.d/nginx_app.conf.template | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z0-9_]+'))" | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' >/etc/nginx/sites-available/default

  local live_path="/etc/letsencrypt/live/$domain"
  if [[ -e "$live_path" ]]; then
    echo "Existing certificate for domain $domain"
    echo "Stop Nginx"
    nginx -s stop
    return
  fi

  echo "Creating certificate for '$domain'"

  echo "Requesting Let's Encrypt certificate for '$domain'..."
  echo "Generating OpenSSL key for '$domain'..."

  mkdir -p "$live_path" && openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$live_path/privkey.pem" \
    -out "$live_path/fullchain.pem" \
    -subj "/CN=localhost"

  echo "Removing key now that validation is done for $domain..."
  rm -Rfv /etc/letsencrypt/live/$domain /etc/letsencrypt/archive/$domain /etc/letsencrypt/renewal/$domain.conf

  echo "Generating certification for domain $domain"
  mkdir -p "$data_path/certbot"
  certbot certonly --webroot --webroot-path="$data_path/certbot" \
    --register-unsafely-without-email \
    --domains $domain \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal

  echo "Stop Nginx"
  nginx -s stop
}