#!/bin/sh
# This script is baked into the appsmith-editor Dockerfile and is used to boot Nginx when the Docker container starts
# Refer: /app/client/Dockerfile
set -ue
NGINX_TEMPLATE_VERSION=$(head -n 1 /nginx.conf.template)

if [ "$NGINX_TEMPLATE_VERSION" = "# Version=2.0" ]; then
    HTTP_PORT=${PORT:-80}
    NGINX_SSL_CMNT=""
    BACKEND_HOST_CMNT=""
    PLATFORM=${PLATFORM:-""}

    if [ $APPSMITH_SSL_ENABLED == true ] && [ -n $APPSMITH_DOMAIN ]; then
        echo "Genereate file have SSL"
    else
        NGINX_SSL_CMNT="#"
        echo "Genereate file not have SSL"
    fi

    if [ "$PLATFORM" = "K8S" ]; then
        BACKEND_HOST_CMNT="#"
    fi

    cat nginx.conf.template | sed -e "s|\$BACKEND_HOST_CMNT|$BACKEND_HOST_CMNT|g" | sed -e "s|\$PORT|$HTTP_PORT|g" | sed -e "s|\$NGINX_SSL_CMNT|$NGINX_SSL_CMNT|g" | sed -e "s|\$APPSMITH_DOMAIN|$APPSMITH_DOMAIN|g" | sed -e "s|__APPSMITH_CLIENT_PROXY_PASS__|http://localhost:3000|g" | sed -e "s|__APPSMITH_SERVER_PROXY_PASS__|http://localhost:8080|g" | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z0-9_]+'))" | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' >/etc/nginx/conf.d/default.conf

    cat /nginx-root.conf.template | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z0-9_]+'))" | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' >/etc/nginx/nginx.conf
    exec nginx -g 'daemon off;'
else
    cat /nginx.conf.template | sed -e "s|__APPSMITH_CLIENT_PROXY_PASS__|http://localhost:3000|g" | sed -e "s|__APPSMITH_SERVER_PROXY_PASS__|http://localhost:8080|g" | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z0-9_]+'))" | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' >/etc/nginx/conf.d/default.conf
    cat /nginx-root.conf.template | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z0-9_]+'))" | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' >/etc/nginx/nginx.conf
    exec nginx -g 'daemon off;'
fi
