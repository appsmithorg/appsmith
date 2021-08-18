#!/usr/bin/env bash

set -e

set -o allexport
. /opt/appsmith/docker.env
set +o allexport
if [[ -n $CUSTOM_DOMAIN ]]; then
    #then run script
	data_path="/opt/appsmith/data/certificate"
	domain="$CUSTOM_DOMAIN"
	rsa_key_size=4096
	
	certbot certonly --webroot --webroot-path="$data_path/certbot" \
		--register-unsafely-without-email \
		--domains $domain \
		--rsa-key-size $rsa_key_size \
		--agree-tos \
		--force-renewal
	supervisorctl restart editor
fi