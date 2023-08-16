#!/usr/bin/env bash

set -e

ENV_PATH="/appsmith-stacks/configuration/docker.env"
PRE_DEFINED_ENV_PATH="$TMP/pre-define.env"
if [[ -f /appsmith-stacks/configuration/docker.env ]]; then
  echo 'Load environment configuration'
  set -o allexport
  . "$ENV_PATH"
  . "$PRE_DEFINED_ENV_PATH"
  set +o allexport
fi

if [[ -n $APPSMITH_CUSTOM_DOMAIN ]]; then
  data_path="/appsmith-stacks/data/certificate"

  certbot certonly --webroot --webroot-path="$data_path/certbot" \
    --config-dir "/appsmith-stacks/letsencrypt" \
    --register-unsafely-without-email \
    --domains "$APPSMITH_CUSTOM_DOMAIN" \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal
  supervisorctl restart editor
else
  echo 'Custom domain not configured. Cannot enable SSL without a custom domain.' >&2
fi
