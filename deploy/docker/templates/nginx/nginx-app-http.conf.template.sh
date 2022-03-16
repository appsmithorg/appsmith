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

server {
  listen 80;
  server_name $CUSTOM_DOMAIN;

  client_max_body_size 100m;

  gzip on;

  root /opt/appsmith/editor;
  index index.html index.htm;

  location /.well-known/acme-challenge/ {
    root /appsmith-stacks/data/certificate/certbot;
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
