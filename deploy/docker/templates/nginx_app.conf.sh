#!/bin/bash

set -o nounset

NGINX_SSL_CMNT="$1"
CUSTOM_DOMAIN="$2"

cat <<EOF
server {
  listen ${PORT:-80} default_server;
$NGINX_SSL_CMNT  server_name $CUSTOM_DOMAIN ;
  client_max_body_size 100m;

  gzip on;

  root /opt/appsmith/editor;
  index index.html index.htm;

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
    proxy_set_header   Host             \$http_host/supervisor/;
    proxy_set_header   X-Forwarded-For  \$proxy_add_x_forwarded_for;
    proxy_set_header   Connection       "";
    proxy_pass http://localhost:9001/;

    auth_basic "Protected";
    auth_basic_user_file /etc/nginx/passwords;
  }

  proxy_set_header X-Forwarded-Proto \$scheme;
  proxy_set_header X-Forwarded-Host \$http_host;

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
    sub_filter __APPSMITH_RECAPTCHA_SECRET_KEY__ '\${APPSMITH_RECAPTCHA_SECRET_KEY}';
    sub_filter __APPSMITH_RECAPTCHA_ENABLED__ '\${APPSMITH_RECAPTCHA_ENABLED}';

    # This block is used to redirect requests Supervisor End-point to perform control action for processes
    if (\$http_referer ~ "^.*/supervisor"){
      return 301 /supervisor/\$request_uri;
    }	
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

$NGINX_SSL_CMNT server {
$NGINX_SSL_CMNT    listen 443 ssl;
$NGINX_SSL_CMNT    server_name $CUSTOM_DOMAIN;
$NGINX_SSL_CMNT    client_max_body_size 100m;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    ssl_certificate /etc/letsencrypt/live/$CUSTOM_DOMAIN/fullchain.pem;
$NGINX_SSL_CMNT    ssl_certificate_key /etc/letsencrypt/live/$CUSTOM_DOMAIN/privkey.pem;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    include /appsmith-stacks/data/certificate/conf/options-ssl-nginx.conf;
$NGINX_SSL_CMNT    ssl_dhparam /appsmith-stacks/data/certificate/conf/ssl-dhparams.pem;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT  	 location /supervisor/ {
$NGINX_SSL_CMNT    	   proxy_http_version 1.1;
$NGINX_SSL_CMNT    	   proxy_buffering     off;
$NGINX_SSL_CMNT    	   proxy_max_temp_file_size 0;
$NGINX_SSL_CMNT    	   proxy_redirect     off;
$NGINX_SSL_CMNT    	   proxy_set_header   Host             \$http_host/supervisor/;
$NGINX_SSL_CMNT    	   proxy_set_header   X-Real-IP        \$remote_addr;
$NGINX_SSL_CMNT   	   proxy_set_header   X-Forwarded-For  \$proxy_add_x_forwarded_for;
$NGINX_SSL_CMNT    	   proxy_set_header   Connection       "";
$NGINX_SSL_CMNT    	   proxy_pass http://localhost:9001/;
$NGINX_SSL_CMNT    	   auth_basic "Protected";
$NGINX_SSL_CMNT    	   auth_basic_user_file /etc/nginx/passwords;
$NGINX_SSL_CMNT    }
$NGINX_SSL_CMNT  	 
$NGINX_SSL_CMNT    proxy_set_header X-Forwarded-Proto \$scheme;
$NGINX_SSL_CMNT    proxy_set_header X-Forwarded-Host \$host;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    root /opt/appsmith/editor;
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
$NGINX_SSL_CMNT        sub_filter __APPSMITH_OPTIMIZELY_KEY__ '\${APPSMITH_OPTIMIZELY_KEY}';
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
$NGINX_SSL_CMNT    		 
$NGINX_SSL_CMNT        # This block is used to redirect requests Supervisor End-point to perform control action for processes
$NGINX_SSL_CMNT    	   if (\$http_referer ~ "^.*/supervisor"){
$NGINX_SSL_CMNT            return 301 /supervisor/\$request_uri;
$NGINX_SSL_CMNT        }	
$NGINX_SSL_CMNT    }
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    location /api {
$NGINX_SSL_CMNT        proxy_pass http://localhost:8080;
$NGINX_SSL_CMNT    }
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    location /oauth2 {
$NGINX_SSL_CMNT        proxy_pass http://localhost:8080;
$NGINX_SSL_CMNT    }
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    location /login {
$NGINX_SSL_CMNT        proxy_pass http://localhost:8080;
$NGINX_SSL_CMNT    }
$NGINX_SSL_CMNT 
$NGINX_SSL_CMNT	   location /socket.io {
$NGINX_SSL_CMNT        proxy_pass http://localhost:8091;
$NGINX_SSL_CMNT        proxy_http_version 1.1;
$NGINX_SSL_CMNT        proxy_set_header Host \$host;
$NGINX_SSL_CMNT        proxy_set_header Connection 'upgrade';
$NGINX_SSL_CMNT        proxy_set_header Upgrade \$http_upgrade;
$NGINX_SSL_CMNT    }
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT }
EOF
