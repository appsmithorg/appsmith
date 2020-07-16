#!/bin/sh

if [ ! -f nginx_app.conf ]; then
    touch nginx_app.conf
fi

# This template file is different from the others because of the sub_filter commands in the Nginx configuration
# Those variables are substituted inside the Docker container for appsmith-editor during bootup. 
# Hence we wish to prevent environment substitution here.
# Relevant variables will be replaced at the end of this file via sed command

echo '
server {
    listen 80;
$NGINX_SSL_CMNT    server_name $custom_domain ;
    client_max_body_size 10m;

    gzip on;

    root /var/www/appsmith;
    index index.html index.htm;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    
    location / {
        try_files $uri /index.html =404;

        sub_filter __APPSMITH_SENTRY_DSN__ '\''${APPSMITH_SENTRY_DSN}'\'';
        sub_filter __APPSMITH_APPSMITH_HOTJAR_HJID__ '\''${APPSMITH_HOTJAR_HJID}'\'';
        sub_filter __APPSMITH_HOTJAR_HJSV__ '\''${APPSMITH_HOTJAR_HJSV}'\'';
        sub_filter __APPSMITH_OAUTH2_GOOGLE_CLIENT_ID__ '\''${APPSMITH_OAUTH2_GOOGLE_CLIENT_ID}'\'';
        sub_filter __APPSMITH_OAUTH2_GITHUB_CLIENT_ID__ '\''${APPSMITH_OAUTH2_GITHUB_CLIENT_ID}'\'';
        sub_filter __APPSMITH_MARKETPLACE_URL__ '\''${APPSMITH_MARKETPLACE_URL}'\'';
        sub_filter __APPSMITH_SEGMENT_KEY__ '\''${APPSMITH_SEGMENT_KEY}'\'';
        sub_filter __APPSMITH_OPTIMIZELY_KEY__ '\''${APPSMITH_OPTIMIZELY_KEY}'\'';
        sub_filter __APPSMITH_ALGOLIA_API_ID__ '\''${APPSMITH_ALGOLIA_API_ID}'\'';
        sub_filter __APPSMITH_ALGOLIA_SEARCH_INDEX_NAME__ '\''${APPSMITH_ALGOLIA_SEARCH_INDEX_NAME}'\'';
        sub_filter __APPSMITH_ALGOLIA_API_KEY__ '\''${APPSMITH_ALGOLIA_API_KEY}'\'';
        sub_filter __APPSMITH_CLIENT_LOG_LEVEL__ '\''${APPSMITH_CLIENT_LOG_LEVEL}'\'';
        sub_filter __APPSMITH_GOOGLE_MAPS_API_KEY__ '\''${APPSMITH_GOOGLE_MAPS_API_KEY}'\'';
        sub_filter __APPSMITH_TNC_PP__ '\''${APPSMITH_TNC_PP}'\'';
    }

    location /f {
       proxy_pass https://cdn.optimizely.com/;
    }
    
    location /api {
        proxy_pass http://appsmith-internal-server:8080;
    }

    location /oauth2 {
        proxy_pass http://appsmith-internal-server:8080;
    }
}

$NGINX_SSL_CMNT server {
$NGINX_SSL_CMNT    listen 443 ssl;
$NGINX_SSL_CMNT    server_name $custom_domain;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    ssl_certificate /etc/letsencrypt/live/$custom_domain/fullchain.pem;
$NGINX_SSL_CMNT    ssl_certificate_key /etc/letsencrypt/live/$custom_domain/privkey.pem;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    include /etc/letsencrypt/options-ssl-nginx.conf;
$NGINX_SSL_CMNT    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    proxy_set_header X-Forwarded-Proto $scheme;
$NGINX_SSL_CMNT    proxy_set_header X-Forwarded-Host $host;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    root /var/www/appsmith;
$NGINX_SSL_CMNT    index index.html index.htm;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    location / {
$NGINX_SSL_CMNT        try_files $uri /index.html =404;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT        sub_filter __APPSMITH_SENTRY_DSN__ '\''${APPSMITH_SENTRY_DSN}'\'';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_APPSMITH_HOTJAR_HJID__ '\''${APPSMITH_HOTJAR_HJID}'\'';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_HOTJAR_HJSV__ '\''${APPSMITH_HOTJAR_HJSV}'\'';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_OAUTH2_GOOGLE_CLIENT_ID__ '\''${APPSMITH_OAUTH2_GOOGLE_CLIENT_ID}'\'';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_OAUTH2_GITHUB_CLIENT_ID__ '\''${APPSMITH_OAUTH2_GITHUB_CLIENT_ID}'\'';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_MARKETPLACE_URL__ '\''${APPSMITH_MARKETPLACE_URL}'\'';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_SEGMENT_KEY__ '\''${APPSMITH_SEGMENT_KEY}'\'';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_OPTIMIZELY_KEY__ '\''${APPSMITH_OPTIMIZELY_KEY}'\'';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_ALGOLIA_API_ID__ '\''${APPSMITH_ALGOLIA_API_ID}'\'';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_ALGOLIA_SEARCH_INDEX_NAME__ '\''${APPSMITH_ALGOLIA_SEARCH_INDEX_NAME}'\'';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_ALGOLIA_API_KEY__ '\''${APPSMITH_ALGOLIA_API_KEY}'\'';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_CLIENT_LOG_LEVEL__ '\''${APPSMITH_CLIENT_LOG_LEVEL}'\'';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_GOOGLE_MAPS_API_KEY__ '\''${APPSMITH_GOOGLE_MAPS_API_KEY}'\'';
$NGINX_SSL_CMNT        sub_filter __APPSMITH_TNC_PP__ '\''${APPSMITH_TNC_PP}'\'';
$NGINX_SSL_CMNT    }
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    location /f {
$NGINX_SSL_CMNT       proxy_pass https://cdn.optimizely.com/;
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
$NGINX_SSL_CMNT }
' > nginx_app.conf

sed -in "s/\$NGINX_SSL_CMNT/$NGINX_SSL_CMNT/g" nginx_app.conf
sed -in "s/\$custom_domain/$custom_domain/g" nginx_app.conf