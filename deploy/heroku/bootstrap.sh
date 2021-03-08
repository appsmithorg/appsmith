#!/bin/bash

set -e

HTTP_PORT=${PORT:-80}
NGINX_SSL_CMNT="#"
APPSMITH_DOMAIN=""
BACKEND_HOST_CMNT=""

function get_maximum_heap() {
    resource=$(ulimit -u)
    echo "Resource : $resource"
    if [[ "$resource" -le 256 ]]; then
        maximum_heap=128
    elif [[ "$resource" -le 512 ]]; then
        maximum_heap=256
    fi
}

function start_applcation() {
    nginx
    echo "Maximum_heap : $maximum_heap"
    if [[ ! -z ${maximum_heap} ]]; then
        backend_start_command="java -Xmx${maximum_heap}m -Dserver.port=8080 -Djava.security.egd='file:/dev/./urandom' -jar server.jar"
    else
        backend_start_command="java -XX:+UseContainerSupport -Dserver.port=8080 -Djava.security.egd='file:/dev/./urandom' -jar server.jar"
    fi
    echo "Backend command : $backend_start_command"
    eval $backend_start_command
}

# Check for enviroment vairalbes
if [[ -z "${APPSMITH_MAIL_ENABLED}" ]]; then
    unset APPSMITH_MAIL_ENABLED # If this field is empty is might cause application crash
fi

if [[ -z "${APPSMITH_OAUTH2_GITHUB_CLIENT_ID}" ]] || [[ -z "${APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET}" ]]; then
    unset APPSMITH_OAUTH2_GITHUB_CLIENT_ID # If this field is empty is might cause application crash
    unset APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET
fi

if [[ -z "${APPSMITH_OAUTH2_GOOGLE_CLIENT_ID}" ]] || [[ -z "${APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET}" ]]; then
    unset APPSMITH_OAUTH2_GOOGLE_CLIENT_ID # If this field is empty is might cause application crash
    unset APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET
fi

if [[ -z "${APPSMITH_GOOGLE_MAPS_API_KEY}" ]]; then
    unset APPSMITH_GOOGLE_MAPS_API_KEY
fi

cat /nginx.conf.template | sed -e "s|\$BACKEND_HOST_CMNT|$BACKEND_HOST_CMNT|g" | sed -e "s|appsmith-internal-server|localhost|g" | sed -e "s|\$PORT|$HTTP_PORT|g" | sed -e "s|\$NGINX_SSL_CMNT|$NGINX_SSL_CMNT|g" | sed -e "s|\$APPSMITH_DOMAIN|$APPSMITH_DOMAIN|g" | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z0-9_]+'))" | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' >/etc/nginx/conf.d/default.conf
cat /nginx-root.conf.template | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z0-9_]+'))" | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' >/etc/nginx/nginx.conf

get_maximum_heap
start_applcation
