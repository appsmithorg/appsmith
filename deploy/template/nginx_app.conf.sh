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

server {
    listen 443 ssl;
    server_name $custom_domain;

    ssl_certificate /etc/letsencrypt/live/$custom_domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$custom_domain/privkey.pem;

    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header X-Forwarded-Host \$host;

    root /var/www/appsmith;
    index index.html index.htm;

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


EOF
