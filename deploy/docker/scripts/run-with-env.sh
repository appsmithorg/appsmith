#!/bin/bash

ENV_PATH="/appsmith-stacks/configuration/docker.env"
PRE_DEFINED_ENV_PATH="/opt/appsmith/templates/pre-define.env"
echo 'Load environment configuration'
set -o allexport
. "$ENV_PATH"
. "$PRE_DEFINED_ENV_PATH"
set +o allexport

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

if [[ -z "${APPSMITH_RECAPTCHA_SITE_KEY}" ]] || [[ -z "${APPSMITH_RECAPTCHA_SECRET_KEY}" ]] || [[ -z "${APPSMITH_RECAPTCHA_ENABLED}" ]]; then
  unset APPSMITH_RECAPTCHA_SITE_KEY # If this field is empty is might cause application crash
  unset APPSMITH_RECAPTCHA_SECRET_KEY
  unset APPSMITH_RECAPTCHA_ENABLED
fi

if [[ -z "${APPSMITH_GIT_ROOT:-}" ]]; then
  export APPSMITH_GIT_ROOT=/appsmith-stacks/git-storage
fi
mkdir -pv "$APPSMITH_GIT_ROOT"

exec "$@"
