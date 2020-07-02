#!/bin/sh
which envsubst;
envsubst $(printf '%s,' $(env | grep -Eo '^APPSMITH_[A-Z_]+')) < /nginx.conf.template | tee /etc/nginx/conf.d/app.conf && exec nginx -g 'daemon off;'
