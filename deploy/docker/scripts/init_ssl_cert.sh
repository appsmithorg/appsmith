#!/bin/bash

init_ssl_cert() {
  APPSMITH_CUSTOM_DOMAIN="$1"

  local rsa_key_size=4096
  local data_path="/appsmith-stacks/data/certificate"

  mkdir -p "$data_path" "$data_path"/{conf,www}

  if ! [[ -e "$data_path/conf/options-ssl-nginx.conf" && -e "$data_path/conf/ssl-dhparams.pem" ]]; then
    echo "Adding recommended TLS parameters..."
    cat <<EOF > "$data_path/conf/options-ssl-nginx.conf"
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

    cat <<EOF > "$data_path/conf/ssl-dhparams.pem"
-----BEGIN DH PARAMETERS-----
MIIBCAKCAQEA//////////+t+FRYortKmq/cViAnPTzx2LnFg84tNpWp4TZBFGQz
+8yTnc4kmz75fS/jY2MMddj2gbICrsRhetPfHtXV/WVhJDP1H18GbtCFY2VVPe0a
87VXE15/V8k1mE8McODmi3fipona8+/och3xWKE2rec1MKzKT0g6eXq8CrGCsyT7
YdEIqUuyyOP7uWrat2DX9GgdT0Kj3jlN9K5W7edjcrsZCwenyO4KbXCeAvzhzffi
7MA0BM0oNC9hkXL+nOmFg/+OTxIy7vKBg8P+OxtMb61zO7X8vC7CIAXFjvGDfRaD
ssbzSibBsu/6iGtCOGEoXJf//////////wIBAg==
-----END DH PARAMETERS-----
EOF
    echo
  fi

  echo "Re-generating nginx config template with domain"
  bash "/opt/appsmith/templates/nginx-app-http.conf.template.sh" "$APPSMITH_CUSTOM_DOMAIN" >"/etc/nginx/conf.d/nginx_app.conf.template"

  echo "Generating nginx configuration"
  cat /etc/nginx/conf.d/nginx_app.conf.template | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z0-9_]+'))" | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' >/etc/nginx/sites-available/default

  echo "Start Nginx to verify certificate"
  nginx

  local live_path="/etc/letsencrypt/live/$APPSMITH_CUSTOM_DOMAIN"
  local ssl_path="/appsmith-stacks/ssl"
  if [[ -e "$ssl_path/fullchain.pem" ]] && [[ -e "$ssl_path/privkey.pem" ]]; then
    echo "Existing custom certificate"
    echo "Stop Nginx"
    nginx -s stop
    return
  fi

  if [[ -e "$live_path" ]]; then
    echo "Existing certificate for domain $APPSMITH_CUSTOM_DOMAIN"
    echo "Stop Nginx"
    nginx -s stop
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
  rm -Rfv /etc/letsencrypt/live/$APPSMITH_CUSTOM_DOMAIN /etc/letsencrypt/archive/$APPSMITH_CUSTOM_DOMAIN /etc/letsencrypt/renewal/$APPSMITH_CUSTOM_DOMAIN.conf

  echo "Generating certification for domain $APPSMITH_CUSTOM_DOMAIN"
  mkdir -p "$data_path/certbot"
  certbot certonly --webroot --webroot-path="$data_path/certbot" \
    --register-unsafely-without-email \
    --domains $APPSMITH_CUSTOM_DOMAIN \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal

  if (($? != 0)); then
    echo "Stop Nginx due to provisioning fail"
    nginx -s stop
    return 1
  fi

  echo "Stop Nginx"
  nginx -s stop
}