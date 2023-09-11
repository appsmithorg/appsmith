#!/bin/bash

set -o nounset

use_https="$1"
custom_domain="${2:-_}"

if [[ $use_https == 1 ]]; then
  # By default, container will use the auto-generate certificate by Let's Encrypt
  ssl_cert_path="/appsmith-stacks/letsencrypt/live/$custom_domain/fullchain.pem"
  ssl_key_path="/appsmith-stacks/letsencrypt/live/$custom_domain/privkey.pem"

  # In case of existing custom certificate, container will use them to configure SSL
  if [[ -e "/appsmith-stacks/ssl/fullchain.pem" ]] && [[ -e "/appsmith-stacks/ssl/privkey.pem" ]]; then
    ssl_cert_path="/appsmith-stacks/ssl/fullchain.pem"
    ssl_key_path="/appsmith-stacks/ssl/privkey.pem"
  fi
fi

additional_downstream_headers='
# https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
add_header X-Content-Type-Options "nosniff";
'

cat <<EOF
user www-data;
worker_processes auto;
pid '$TMP/nginx.pid';

error_log stderr info;

events {
  worker_connections 768;
}

http {
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;
  types_hash_max_size 2048;
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  client_body_temp_path '$TMP/nginx-client-body-temp';
  proxy_temp_path '$TMP/nginx-proxy-temp';
  fastcgi_temp_path '$TMP/nginx-fastcgi-temp';
  uwsgi_temp_path '$TMP/nginx-uwsgi-temp';
  scgi_temp_path '$TMP/nginx-scgi-temp';

  ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3; # Dropping SSLv3, ref: POODLE
  ssl_prefer_server_ciphers on;

  # Redirect log to stdout for supervisor to capture.
  access_log /dev/stdout;

  gzip on;
  # gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

  map \$http_x_forwarded_proto \$origin_scheme {
    default \$http_x_forwarded_proto;
    '' \$scheme;
  }

  map \$http_x_forwarded_host \$origin_host {
    default \$http_x_forwarded_host;
    '' \$host;
  }

  map \$http_forwarded \$final_forwarded {
    default '\$http_forwarded, host=\$host;proto=\$scheme';
    '' '';
  }

  server_tokens off;
  more_set_headers 'Server: ';

  server {

  $(
  if [[ $use_https == 1 ]]; then
    echo "
    listen 80;
    server_name $custom_domain;
    return 301 https://\$host\$request_uri;
  }

  server {
    listen 443 ssl http2;
    server_name _;
    ssl_certificate $ssl_cert_path;
    ssl_certificate_key $ssl_key_path;
    include /appsmith-stacks/data/certificate/conf/options-ssl-nginx.conf;
    ssl_dhparam /appsmith-stacks/data/certificate/conf/ssl-dhparams.pem;
  "
  else
    echo "
    listen ${PORT:-80} default_server;
    server_name $custom_domain;
  "
  fi
  )

    client_max_body_size 150m;

    gzip on;
    gzip_types *;

    root '$NGINX_WWW_PATH';
    error_page 404 /;

    # https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors
    add_header Content-Security-Policy "frame-ancestors ${APPSMITH_ALLOWED_FRAME_ANCESTORS-'self' *}";

    $additional_downstream_headers

    location /.well-known/acme-challenge/ {
      root /appsmith-stacks/data/certificate/certbot;
    }

    location = /supervisor {
      return 301 /supervisor/;
    }

    location /supervisor/ {
      proxy_http_version       1.1;
      proxy_buffering          off;
      proxy_max_temp_file_size 0;
      proxy_redirect           off;

      proxy_set_header  Host              \$http_host/supervisor/;
      proxy_set_header  X-Forwarded-For   \$proxy_add_x_forwarded_for;
      proxy_set_header  X-Forwarded-Proto \$origin_scheme;
      proxy_set_header  X-Forwarded-Host  \$origin_host;
      proxy_set_header  Connection        "";

      proxy_pass http://localhost:9001/;

      auth_basic "Protected";
      auth_basic_user_file '$TMP/nginx-passwords';
    }

    proxy_set_header X-Forwarded-Proto \$origin_scheme;
    proxy_set_header X-Forwarded-Host \$origin_host;
    proxy_set_header Forwarded \$final_forwarded;

    location / {
      try_files /loading.html \$uri /index.html =404;
    }

    location ~ ^/static/(js|css|media)\b {
      # Files in these folders are hashed, so we can set a long cache time.
      add_header Cache-Control "max-age=31104000, immutable";  # 360 days
      $additional_downstream_headers
      access_log  off;
    }

    # If the path has an extension at the end, then respond with 404 status if the file not found.
    location ~ ^/(?!supervisor/).*\.[a-z]+$ {
      try_files \$uri =404;
    }

    location /api {
      proxy_read_timeout ${APPSMITH_SERVER_TIMEOUT:-60};
      proxy_send_timeout ${APPSMITH_SERVER_TIMEOUT:-60};
      proxy_pass http://localhost:8080;
    }

    location /oauth2 {
      proxy_pass http://localhost:8080;
    }

    location /login {
      proxy_pass http://localhost:8080;
    }

    location /rts {
      proxy_pass http://localhost:${APPSMITH_RTS_PORT:-8091};
      proxy_http_version 1.1;
      proxy_set_header Host \$host;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Upgrade \$http_upgrade;
    }
  }

}
EOF
