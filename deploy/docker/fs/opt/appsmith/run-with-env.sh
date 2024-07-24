#!/bin/bash

ENV_PATH="/appsmith-stacks/configuration/docker.env"
PRE_DEFINED_ENV_PATH="$TMP/pre-define.env"
tlog 'Load environment configuration'
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

if [[ -z "${APPSMITH_RECAPTCHA_SITE_KEY}" ]] || [[ -z "${APPSMITH_RECAPTCHA_SECRET_KEY}" ]] || [[ -z "${APPSMITH_RECAPTCHA_ENABLED}" ]]; then
  unset APPSMITH_RECAPTCHA_SITE_KEY # If this field is empty is might cause application crash
  unset APPSMITH_RECAPTCHA_SECRET_KEY
  unset APPSMITH_RECAPTCHA_ENABLED
fi

if [[ -z "${APPSMITH_GIT_ROOT:-}" ]]; then
  export APPSMITH_GIT_ROOT=/appsmith-stacks/git-storage
else
  tlog "WARNING: It appears a custom value has been configured for APPSMITH_GIT_ROOT. This behaviour is deprecated and will soon be removed." >&2
fi
mkdir -pv "$APPSMITH_GIT_ROOT"

# Check if APPSMITH_DB_URL is set
if [[ -z "${APPSMITH_DB_URL}" ]]; then
  # If APPSMITH_DB_URL is not set, fall back to APPSMITH_MONGODB_URI
  export APPSMITH_DB_URL="${APPSMITH_MONGODB_URI}"
fi

exec "$@"
