#!/bin/sh
# This script is baked into the appsmith-editor Dockerfile and is used to boot Nginx when the Docker container starts
# Refer: /app/client/Dockerfile
set -ue
cat /nginx.conf.template | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z0-9_]+'))" | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' > /etc/nginx/conf.d/default.conf
cat /nginx-root.conf.template | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z0-9_]+'))" | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' > /etc/nginx/nginx.conf
exec nginx -g 'daemon off;'
