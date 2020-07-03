#!/bin/sh
set -ue
which envsubst;
export APPSMITH_GOOGLE_MAPS_API_KEY=" "
export APPSMITH_OPTIMIZELY_KEY=SOMETHING
export APPSMITH_ALGOLIA_API_KEY="algolia something"
cat /nginx.conf.template | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z_]+'))" | sed -e 's|\${\(APPSMITH_[A-Z_]*\)}||g' | tee /etc/nginx/conf.d/app.conf
exec nginx -g 'daemon off;'
