#!/bin/bash

# run the following commands before the docker run command
# brew install mkcert (if you don't already have it installed)
# run the following commented command from the project root directory
# cd docker && mkcert -install && mkcert "*.appsmith.com" && cd ..
# If this returns a hash successfully, then you can access the application locally using https://dev.appsmith.com

if ! docker_loc="$(type -p "docker")" || [[ -z $docker_loc ]]; then
    echo "Could not find docker cli"
    exit
fi

if ! envsubst_loc="$(type -p "envsubst")" || [[ -z $envsubst_loc ]]; then
    echo "Could not find envsubst: If you're on a mac; brew install gettext"
    exit
fi


KEY_FILE=./docker/_wildcard.appsmith.com-key.pem
CERT_FILE=./docker/_wildcard.appsmith.com.pem
if ! test -f "$KEY_FILE" || ! test -f "$CERT_FILE"; then
    echo "
    KEY and/or CERTIFICATE not found
    Please install mkcert and generate
    the key and certificate files
    by running the following command

    cd docker && mkcert -install && mkcert \"*.appsmith.com\" && cd ..

    "
    exit
fi

ENV_FILE=../../.env
if ! test -f "$ENV_FILE"; then
    echo "
        Please populate the .env at the root of the project and run again
        Or add the environment variables defined in .env.example to the environment
        -- to enable features
    "
else
    export $(grep -v '^[[:space:]]*#' ${ENV_FILE} | xargs)
fi

default_server_proxy="http://host.docker.internal:8080"
default_client_proxy="http://host.docker.internal:3000"

default_linux_server_proxy="http://localhost:8080"
default_linux_client_proxy="http://localhost:3000"

# default server to internal docker
server_proxy_pass="${1:-$default_server_proxy}"
if [[ $server_proxy_pass =~ /$ ]]; then
    echo "The given server proxy ($1) ends with a '/'. This will change Nginx's behavior in unintended ways." >&2
    echo "Exiting. Please run again, removing the trailing slash(es) for the server proxy endpoint." >&2
    exit 1
fi

# Stop and remove existing container
# Ignore outcome in case someone decides to set -e later
docker rm -f wildcard-nginx || true

uname_out="$(uname -s)"
vars_to_substitute="$(printf '\$%s,' $(grep -o "^APPSMITH_[A-Z0-9_]\+" "$ENV_FILE" | xargs))"
client_proxy_pass="${default_client_proxy}"
network_mode="bridge"
case "${uname_out}" in
    Linux*)

        source ../util/is_wsl.sh
        if [ $IS_WSL ]; then
            : # ignore to continue using host.docker.internal
        else
            network_mode="host"
            client_proxy_pass=$default_linux_client_proxy
            # if no server was passed
            if [[ -z $1 ]]; then
                server_proxy_pass=$default_linux_server_proxy
            fi
        fi
        echo "
    Starting nginx for Linux...
        "
        cat ./docker/templates/nginx-app.conf.template | sed -e "s|__APPSMITH_CLIENT_PROXY_PASS__|${client_proxy_pass}|g" | sed -e "s|__APPSMITH_SERVER_PROXY_PASS__|${server_proxy_pass}|g" | envsubst ${vars_to_substitute} | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' > ./docker/nginx.conf  &&
        cat ./docker/templates/nginx-root.conf.template | envsubst ${vars_to_substitute} | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' > ./docker/nginx-root.conf  &&
        sudo docker run --network ${network_mode} --name wildcard-nginx -d -p 80:80 -p 443:443 -v "`pwd`/docker/nginx-root.conf:/etc/nginx/nginx.conf" -v "`pwd`/docker/nginx.conf:/etc/nginx/conf.d/app.conf" -v "`pwd`/docker/_wildcard.appsmith.com.pem:/etc/certificate/dev.appsmith.com.pem" -v "`pwd`/docker/_wildcard.appsmith.com-key.pem:/etc/certificate/dev.appsmith.com-key.pem" nginx:latest \
        && echo "
    nginx is listening on port 443 and forwarding to port 3000
    visit https://dev.appsmith.com
        "
    ;;
    Darwin*)
        echo "
    Starting nginx for MacOS...
        "
        cat ./docker/templates/nginx-app.conf.template | sed -e "s|__APPSMITH_CLIENT_PROXY_PASS__|${client_proxy_pass}|g" | sed -e "s|__APPSMITH_SERVER_PROXY_PASS__|${server_proxy_pass}|g" | envsubst ${vars_to_substitute} | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' > ./docker/nginx.conf  &&
        cat ./docker/templates/nginx-root.conf.template | envsubst ${vars_to_substitute} | sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' > ./docker/nginx-root.conf  &&
        docker run --name wildcard-nginx -d -p 80:80 -p 443:443 -v "`pwd`/docker/nginx-root.conf:/etc/nginx/nginx.conf" -v "`pwd`/docker/nginx.conf:/etc/nginx/conf.d/app.conf" -v "`pwd`/docker/_wildcard.appsmith.com.pem:/etc/certificate/dev.appsmith.com.pem" -v "`pwd`/docker/_wildcard.appsmith.com-key.pem:/etc/certificate/dev.appsmith.com-key.pem" nginx:latest \
        && echo "
    nginx is listening on port 443 and forwarding to port 3000
    visit https://dev.appsmith.com
        "
    ;;
    *)          echo "Unknown OS: Please use MacOS or a distribution of linux."
esac
