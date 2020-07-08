#!/bin/sh
set -ue
cat /nginx.conf.template | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z0-9_]+'))" | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' | tee /etc/nginx/conf.d/app.conf
exec nginx -g 'daemon off;'
