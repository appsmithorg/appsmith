#!/bin/bash

init_ssl_cert() {
  APPSMITH_CUSTOM_DOMAIN="$1"

  local rsa_key_size=4096
  local data_path="/appsmith-stacks/data/certificate"

  mkdir -p "$data_path/www"

  echo "Re-generating nginx config template with domain"
  bash /opt/appsmith/templates/nginx.conf.sh 0 "$APPSMITH_CUSTOM_DOMAIN" > "$NGINX_CONF_PATH"

  echo "Start Nginx to verify certificate"
  nginx -c "$NGINX_CONF_PATH"

  local live_path="$CERTBOT_CONFIG_DIR/live/$APPSMITH_CUSTOM_DOMAIN"
  local ssl_path="/appsmith-stacks/ssl"
  if [[ -e "$ssl_path/fullchain.pem" ]] && [[ -e "$ssl_path/privkey.pem" ]]; then
    echo "Existing custom certificate"
    echo "Stop Nginx"
    nginx -c "$NGINX_CONF_PATH" -s stop
    return
  fi

  if [[ -e "$live_path" ]]; then
    echo "Existing certificate for domain $APPSMITH_CUSTOM_DOMAIN"
    echo "Stop Nginx"
    nginx -c "$NGINX_CONF_PATH" -s stop
    return
  fi

  echo "Creating certificate for '$APPSMITH_CUSTOM_DOMAIN'"

  echo "Requesting Let's Encrypt certificate for '$APPSMITH_CUSTOM_DOMAIN'..."
  echo "Generating OpenSSL key for '$APPSMITH_CUSTOM_DOMAIN'..."

  mkdir -p "$live_path" && openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$live_path/privkey.pem" \
    -out "$live_path/fullchain.pem" \
    -subj "/CN=localhost"

  echo "Removing key now that validation is done for $APPSMITH_CUSTOM_DOMAIN..."
  rm -Rfv "$CERTBOT_CONFIG_DIR/live/$APPSMITH_CUSTOM_DOMAIN" "$CERTBOT_CONFIG_DIR/archive/$APPSMITH_CUSTOM_DOMAIN" "$CERTBOT_CONFIG_DIR/renewal/$APPSMITH_CUSTOM_DOMAIN.conf"

  echo "Generating certification for domain $APPSMITH_CUSTOM_DOMAIN"
  mkdir -p "$data_path/certbot"
  # todo: also set --work-dir and --logs-dir to either under /appsmith-stacks, or under "$TMP"
  certbot certonly --webroot --webroot-path="$data_path/certbot" \
    --config-dir "$CERTBOT_CONFIG_DIR" \
    --register-unsafely-without-email \
    --domains "$APPSMITH_CUSTOM_DOMAIN" \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal

  echo "Stop Nginx"
  nginx -c "$NGINX_CONF_PATH" -s stop

  if (($? != 0)); then
    echo "Provisioning failed"
    return 1
  fi
}
