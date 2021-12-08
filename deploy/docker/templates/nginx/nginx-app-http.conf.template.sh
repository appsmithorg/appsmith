#!/bin/bash

set -o nounset

CUSTOM_DOMAIN="$1"
MONITORING_ENABLED="$2"
MONITORING_CMNT="#"

if [ -z $CUSTOM_DOMAIN ]; then
  CUSTOM_DOMAIN=_
fi

if [[ "$MONITORING_ENABLED" = "true" ]]; then
  MONITORING_CMNT=""
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

$MONITORING_CMNT  location = /monitoring {
$MONITORING_CMNT    return 301 /monitoring/;
$MONITORING_CMNT  }
$MONITORING_CMNT
$MONITORING_CMNT  location /monitoring/ {
$MONITORING_CMNT    proxy_set_header X-Forwarded-Host \$http_host;
$MONITORING_CMNT    proxy_set_header X-Forwarded-Server \$http_host;
$MONITORING_CMNT    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
$MONITORING_CMNT    proxy_pass http://localhost:19999/;
$MONITORING_CMNT    proxy_http_version 1.1;
$MONITORING_CMNT    proxy_pass_request_headers on;
$MONITORING_CMNT    proxy_set_header Connection "keep-alive";
$MONITORING_CMNT    proxy_store off;
$MONITORING_CMNT    auth_basic "Protected";
$MONITORING_CMNT    auth_basic_user_file passwords;
$MONITORING_CMNT    gzip on;
$MONITORING_CMNT    gzip_proxied any;
$MONITORING_CMNT    gzip_types *;		
$MONITORING_CMNT  }

  location / {
    try_files \$uri /index.html =404;

    sub_filter __APPSMITH_SENTRY_DSN__ '\${APPSMITH_SENTRY_DSN}';
    sub_filter __APPSMITH_SMART_LOOK_ID__ '\${APPSMITH_SMART_LOOK_ID}';
    sub_filter __APPSMITH_OAUTH2_GOOGLE_CLIENT_ID__ '\${APPSMITH_OAUTH2_GOOGLE_CLIENT_ID}';
    sub_filter __APPSMITH_OAUTH2_GITHUB_CLIENT_ID__ '\${APPSMITH_OAUTH2_GITHUB_CLIENT_ID}';
    sub_filter __APPSMITH_MARKETPLACE_ENABLED__ '\${APPSMITH_MARKETPLACE_ENABLED}';
    sub_filter __APPSMITH_SEGMENT_KEY__ '\${APPSMITH_SEGMENT_KEY}';
    sub_filter __APPSMITH_OPTIMIZELY_KEY__ '\${APPSMITH_OPTIMIZELY_KEY}';
    sub_filter __APPSMITH_ALGOLIA_API_ID__ '\${APPSMITH_ALGOLIA_API_ID}';
    sub_filter __APPSMITH_ALGOLIA_SEARCH_INDEX_NAME__ '\${APPSMITH_ALGOLIA_SEARCH_INDEX_NAME}';
    sub_filter __APPSMITH_ALGOLIA_API_KEY__ '\${APPSMITH_ALGOLIA_API_KEY}';
    sub_filter __APPSMITH_CLIENT_LOG_LEVEL__ '\${APPSMITH_CLIENT_LOG_LEVEL}';
    sub_filter __APPSMITH_GOOGLE_MAPS_API_KEY__ '\${APPSMITH_GOOGLE_MAPS_API_KEY}';
    sub_filter __APPSMITH_TNC_PP__ '\${APPSMITH_TNC_PP}';
    sub_filter __APPSMITH_VERSION_ID__ '\${APPSMITH_VERSION_ID}';
    sub_filter __APPSMITH_VERSION_RELEASE_DATE__ '\${APPSMITH_VERSION_RELEASE_DATE}';
    sub_filter __APPSMITH_INTERCOM_APP_ID__ '\${APPSMITH_INTERCOM_APP_ID}';
    sub_filter __APPSMITH_MAIL_ENABLED__ '\${APPSMITH_MAIL_ENABLED}';
    sub_filter __APPSMITH_DISABLE_TELEMETRY__ '\${APPSMITH_DISABLE_TELEMETRY}';
    sub_filter __APPSMITH_RECAPTCHA_SITE_KEY__ '\${APPSMITH_RECAPTCHA_SITE_KEY}';
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
