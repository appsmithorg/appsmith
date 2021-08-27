#!/usr/bin/env bash

set -e

if [[ -f /opt/appsmith/stacks/configuration/docker.env ]]; then
	echo 'Load environment configuration'
	set -o allexport
	. /opt/appsmith/stacks/configuration/docker.env
	set +o allexport
fi

if [[ -n $CUSTOM_DOMAIN ]]; then
	#then run script
	local data_path="/opt/appsmith/stacks/data/certificate"
	domain="$CUSTOM_DOMAIN"
	local rsa_key_size=4096

	certbot certonly --webroot --webroot-path="$data_path/certbot" \
		--register-unsafely-without-email \
		--domains $domain \
		--rsa-key-size $rsa_key_size \
		--agree-tos \
		--force-renewal
	supervisorctl restart editor
else
	echo 'Custom domain not configured. Cannot enable SSL without a custom domain.' >&2
fi