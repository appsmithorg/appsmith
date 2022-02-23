#!/bin/bash

set -o nounset

# In the config file, there's three types of variables, all represented with the syntax `$name`. The ones that are not
# escaped with a backslash are rendered within this script. Among the ones that are escaped with a backslash, the ones
# starting with `APPSMITH_` will be rendered at boot-up time by appsmith-editor docker container. The rest (like $scheme
# and $host) are for nginx to work out.

NGINX_SSL_CMNT="$1"
custom_domain="$2"

cat <<EOF
map \$http_x_forwarded_proto \$origin_scheme {
  default \$http_x_forwarded_proto;
  '' \$scheme;
}

server {
    listen 80;
$NGINX_SSL_CMNT    server_name $custom_domain ;
    client_max_body_size 100m;

    gzip on;

    root /var/www/appsmith;
    index index.html index.htm;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    proxy_set_header X-Forwarded-Proto \$origin_scheme;
    proxy_set_header X-Forwarded-Host \$host;

    location / {
        try_files \$uri /index.html =404;

        sub_filter __APPSMITH_SENTRY_DSN__ '\${APPSMITH_SENTRY_DSN}';
        sub_filter __APPSMITH_SMART_LOOK_ID__ '\${APPSMITH_SMART_LOOK_ID}';
        sub_filter __APPSMITH_OAUTH2_GOOGLE_CLIENT_ID__ '\${APPSMITH_OAUTH2_GOOGLE_CLIENT_ID}';
        sub_filter __APPSMITH_OAUTH2_GITHUB_CLIENT_ID__ '\${APPSMITH_OAUTH2_GITHUB_CLIENT_ID}';
        sub_filter __APPSMITH_MARKETPLACE_ENABLED__ '\${APPSMITH_MARKETPLACE_ENABLED}';
        sub_filter __APPSMITH_SEGMENT_KEY__ '\${APPSMITH_SEGMENT_KEY}';
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
        sub_filter __APPSMITH_RECAPTCHA_SECRET_KEY__ '\${APPSMITH_RECAPTCHA_SECRET_KEY}';
        sub_filter __APPSMITH_RECAPTCHA_ENABLED__ '\${APPSMITH_RECAPTCHA_ENABLED}';
        sub_filter __APPSMITH_DISABLE_INTERCOM__ '\${APPSMITH_DISABLE_INTERCOM}';
    }


    location /api {
        proxy_pass http://appsmith-internal-server:8080;
    }

    location /oauth2 {
        proxy_pass http://appsmith-internal-server:8080;
    }

    location /login {
        proxy_pass http://appsmith-internal-server:8080;
    }
}

$NGINX_SSL_CMNT server {
$NGINX_SSL_CMNT    listen 443 ssl;
$NGINX_SSL_CMNT    server_name $custom_domain;
$NGINX_SSL_CMNT    client_max_body_size 100m;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    ssl_certificate /etc/letsencrypt/live/$custom_domain/fullchain.pem;
$NGINX_SSL_CMNT    ssl_certificate_key /etc/letsencrypt/live/$custom_domain/privkey.pem;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    include /etc/letsencrypt/options-ssl-nginx.conf;
$NGINX_SSL_CMNT    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    proxy_set_header X-Forwarded-Proto \$origin_scheme;
$NGINX_SSL_CMNT    proxy_set_header X-Forwarded-Host \$host;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    root /var/www/appsmith;
$NGINX_SSL_CMNT    index index.html index.htm;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    location / {
$NGINX_SSL_CMNT        try_files \$uri /index.html =404;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT        sub_filter __APPSMITH_SENTRY_DSN__ '\${APPSMITH_SENTRY_DSN}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_SMART_LOOK_ID__ '\${APPSMITH_SMART_LOOK_ID}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_OAUTH2_GOOGLE_CLIENT_ID__ '\${APPSMITH_OAUTH2_GOOGLE_CLIENT_ID}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_OAUTH2_GITHUB_CLIENT_ID__ '\${APPSMITH_OAUTH2_GITHUB_CLIENT_ID}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_MARKETPLACE_ENABLED__ '\${APPSMITH_MARKETPLACE_ENABLED}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_SEGMENT_KEY__ '\${APPSMITH_SEGMENT_KEY}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_ALGOLIA_API_ID__ '\${APPSMITH_ALGOLIA_API_ID}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_ALGOLIA_SEARCH_INDEX_NAME__ '\${APPSMITH_ALGOLIA_SEARCH_INDEX_NAME}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_ALGOLIA_API_KEY__ '\${APPSMITH_ALGOLIA_API_KEY}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_CLIENT_LOG_LEVEL__ '\${APPSMITH_CLIENT_LOG_LEVEL}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_GOOGLE_MAPS_API_KEY__ '\${APPSMITH_GOOGLE_MAPS_API_KEY}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_TNC_PP__ '\${APPSMITH_TNC_PP}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_VERSION_ID__ '\${APPSMITH_VERSION_ID}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_VERSION_RELEASE_DATE__ '\${APPSMITH_VERSION_RELEASE_DATE}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_INTERCOM_APP_ID__ '\${APPSMITH_INTERCOM_APP_ID}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_MAIL_ENABLED__ '\${APPSMITH_MAIL_ENABLED}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_DISABLE_TELEMETRY__ '\${APPSMITH_DISABLE_TELEMETRY}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_RECAPTCHA_SITE_KEY__ '\${APPSMITH_RECAPTCHA_SITE_KEY}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_RECAPTCHA_SECRET_KEY__ '\${APPSMITH_RECAPTCHA_SECRET_KEY}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_RECAPTCHA_ENABLED__ '\${APPSMITH_RECAPTCHA_ENABLED}';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_DISABLE_INTERCOM__ '\${APPSMITH_DISABLE_INTERCOM}';
$NGINX_SSL_CMNT    }
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    location /api {
$NGINX_SSL_CMNT        proxy_pass http://appsmith-internal-server:8080;
$NGINX_SSL_CMNT    }
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    location /oauth2 {
$NGINX_SSL_CMNT        proxy_pass http://appsmith-internal-server:8080;
$NGINX_SSL_CMNT    }
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    location /login {
$NGINX_SSL_CMNT        proxy_pass http://appsmith-internal-server:8080;
$NGINX_SSL_CMNT    }
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT }
EOF
