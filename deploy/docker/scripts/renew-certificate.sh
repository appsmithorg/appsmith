#!/usr/bin/env bash

set -e

ENV_PATH="/appsmith-stacks/configuration/docker.env"
PRE_DEFINED_ENV_PATH="/opt/appsmith/templates/pre-define.env"
if [[ -f /appsmith-stacks/configuration/docker.env ]]; then
  echo 'Load environment configuration'
  set -o allexport
  . "$ENV_PATH"
  . "$PRE_DEFINED_ENV_PATH"
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
