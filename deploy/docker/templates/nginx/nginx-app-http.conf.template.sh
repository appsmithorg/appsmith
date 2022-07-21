#!/bin/bash

set -o nounset

CUSTOM_DOMAIN="$1"

if [[ -z $CUSTOM_DOMAIN ]]; then
	CUSTOM_DOMAIN=_
fi

cat <<EOF
map \$http_x_forwarded_proto \$origin_scheme {
  default \$http_x_forwarded_proto;
  '' \$scheme;
}
# redirect log to stdout for supervisor to capture
access_log /dev/stdout;

server {
  listen ${PORT:-80} default_server;
  server_name $CUSTOM_DOMAIN;

  client_max_body_size 100m;

  gzip on;

  root /opt/appsmith/editor;
  index index.html index.htm;

  # https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors
  add_header Content-Security-Policy "frame-ancestors ${APPSMITH_ALLOWED_FRAME_ANCESTORS-'self'}";

  location /.well-known/acme-challenge/ {
    root /appsmith-stacks/data/certificate/certbot;
  }

  location = /supervisor {
    return 301 /supervisor/;
  }

  location /supervisor/ {
    proxy_http_version 1.1;
    proxy_buffering     off;
    proxy_max_temp_file_size 0;
    proxy_redirect     off;

    proxy_set_header  Host             	\$http_host/supervisor/;
    proxy_set_header  X-Forwarded-For  	\$proxy_add_x_forwarded_for;
    proxy_set_header 	X-Forwarded-Proto \$scheme;
    proxy_set_header 	X-Forwarded-Host 	\$http_host;
    proxy_set_header  Connection       "";

    proxy_pass http://localhost:9001/;

    auth_basic "Protected";
    auth_basic_user_file /etc/nginx/passwords;
  }

  proxy_set_header X-Forwarded-Proto \$origin_scheme;
  proxy_set_header X-Forwarded-Host \$host;

  location / {
    try_files \$uri /index.html =404;
  }

  location /api {
    proxy_pass http://localhost:8080;
  }

  location /oauth2 {
    proxy_pass http://localhost:8080;
  }

  location /login {
    proxy_pass http://localhost:8080;
  }

  location /rts {
    proxy_pass http://localhost:8091;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Upgrade \$http_upgrade;
  }
}
EOF
