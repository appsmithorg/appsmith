#!/usr/bin/env bash

set -e

if [[ -f /appsmith-stacks/configuration/docker.env ]]; then
	echo 'Load environment configuration'
	set -o allexport
	. /appsmith-stacks/configuration/docker.env
	set +o allexport
fi

if [[ -n $APPSMITH_CUSTOM_DOMAIN ]]; then
	data_path="/appsmith-stacks/data/certificate"
	domain="$APPSMITH_CUSTOM_DOMAIN"
	rsa_key_size=4096

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
