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

unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     machine=Linux
                echo "
    Starting nginx for Linux...
    "
                sudo docker run --network host --name wildcard-nginx -d -p 80:80 -p 443:443 -v `pwd`/docker/nginx-linux.conf:/etc/nginx/conf.d/app.conf -v `pwd`/docker/_wildcard.appsmith.com.pem:/etc/certificate/dev.appsmith.com.pem -v `pwd`/docker/_wildcard.appsmith.com-key.pem:/etc/certificate/dev.appsmith.com-key.pem nginx:latest \
                && echo "
    nginx is listening on port 443 and forwarding to port 3000
    visit https://dev.appsmith.com
    "
                ;;
    Darwin*)    machine=Mac
                echo "
    Starting nginx for MacOS...
    "
                docker run --name wildcard-nginx -d -p 80:80 -p 443:443 -v `pwd`/docker/nginx-mac.conf:/etc/nginx/conf.d/app.conf -v `pwd`/docker/_wildcard.appsmith.com.pem:/etc/certificate/dev.appsmith.com.pem -v `pwd`/docker/_wildcard.appsmith.com-key.pem:/etc/certificate/dev.appsmith.com-key.pem nginx:latest \
                && echo "
    nginx is listening on port 443 and forwarding to port 3000
    visit https://dev.appsmith.com
    "
                ;;
    *)          echo "Unknown OS: Please use MacOS or a distribution of linux."
esac
