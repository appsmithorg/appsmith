#!/bin/sh

if [ -f nginx_app.conf ]
  then
    echo "file nginx_app.conf already exists"
  else
    touch nginx_app.conf
fi



cat > nginx_app.conf  << EOF
server {
    listen 80;
    server_name $custom_domain ;
    client_max_body_size 10m;

    gzip on;

    root /var/www/appsmith;
    index index.html index.htm;

    #location / {
    #    return 301 https://\$host\$request_uri;
    #}

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header X-Forwarded-Host \$host;
    
    location / {
        try_files \$uri /index.html =404;
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

$NGINX_SSL_CMNTserver {
$NGINX_SSL_CMNT    listen 443 ssl;
$NGINX_SSL_CMNT    server_name $custom_domain;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    ssl_certificate /etc/letsencrypt/live/$custom_domain/fullchain.pem;
$NGINX_SSL_CMNT    ssl_certificate_key /etc/letsencrypt/live/$custom_domain/privkey.pem;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    include /etc/letsencrypt/options-ssl-nginx.conf;
$NGINX_SSL_CMNT    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    proxy_set_header X-Forwarded-Proto \$scheme;
$NGINX_SSL_CMNT    proxy_set_header X-Forwarded-Host \$host;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    root /var/www/appsmith;
$NGINX_SSL_CMNT    index index.html index.htm;
$NGINX_SSL_CMNT
$NGINX_SSL_CMNT    location / {
$NGINX_SSL_CMNT        try_files \$uri /index.html =404;
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
$NGINX_SSL_CMNT}
EOF
