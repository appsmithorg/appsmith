#!/bin/bash

set -o nounset
MONGO_USER="$1"
DB_PASSWORD="$2"
ENCRYPTION_PASSWORD="$3"
ENCRYPTION_SALT="$4"
SUPERVISOR_PASSWORD="$5"

cat <<EOF
# Sentry
APPSMITH_SENTRY_DSN=

# Smart look
APPSMITH_SMART_LOOK_ID=

# Google OAuth
APPSMITH_OAUTH2_GOOGLE_CLIENT_ID=
APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET=

# Github OAuth
APPSMITH_OAUTH2_GITHUB_CLIENT_ID=
APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET=

# Form Login/Signup
APPSMITH_FORM_LOGIN_DISABLED=
APPSMITH_SIGNUP_DISABLED=

# Segment
APPSMITH_SEGMENT_KEY=

# Algolia Search (Docs)
APPSMITH_ALGOLIA_API_ID=
APPSMITH_ALGOLIA_API_KEY=
APPSMITH_ALGOLIA_SEARCH_INDEX_NAME=

#Client log level (debug | error)
APPSMITH_CLIENT_LOG_LEVEL=

# Email server
APPSMITH_MAIL_ENABLED=
APPSMITH_MAIL_HOST=
APPSMITH_MAIL_PORT=
APPSMITH_MAIL_USERNAME=
APPSMITH_MAIL_PASSWORD=
APPSMITH_MAIL_FROM=
APPSMITH_REPLY_TO=

# Email server feature toggles
# true | false values
APPSMITH_MAIL_SMTP_AUTH=
APPSMITH_MAIL_SMTP_TLS_ENABLED=

# Disable all telemetry
# Note: This only takes effect in self-hosted scenarios.
# Please visit: https://docs.appsmith.com/telemetry to read more about anonymized data collected by Appsmith
APPSMITH_DISABLE_TELEMETRY=false
#APPSMITH_SENTRY_DSN=
#APPSMITH_SENTRY_ENVIRONMENT=

# Google Recaptcha Config
APPSMITH_RECAPTCHA_SITE_KEY=
APPSMITH_RECAPTCHA_SECRET_KEY=
APPSMITH_RECAPTCHA_ENABLED=

APPSMITH_DB_URL=mongodb://$MONGO_USER:$DB_PASSWORD@localhost:27017/appsmith
#APPSMITH_DB_URL=postgresql://appsmith:$DB_PASSWORD@localhost:5432/postgres
APPSMITH_MONGODB_USER=$MONGO_USER
APPSMITH_MONGODB_PASSWORD=$DB_PASSWORD
APPSMITH_API_BASE_URL=http://localhost:8080/api/v1

APPSMITH_REDIS_URL=redis://127.0.0.1:6379

APPSMITH_ENCRYPTION_PASSWORD=$ENCRYPTION_PASSWORD
APPSMITH_ENCRYPTION_SALT=$ENCRYPTION_SALT

APPSMITH_CUSTOM_DOMAIN=

# Java command line arguments, as space-delimited string. Ex: "-Xms800M -Xmx800M"
APPSMITH_JAVA_ARGS=

# APPSMITH_PLUGIN_MAX_RESPONSE_SIZE_MB=5
# MAX PAYLOAD SIZE
# APPSMITH_CODEC_SIZE=

APPSMITH_SUPERVISOR_USER=appsmith
APPSMITH_SUPERVISOR_PASSWORD=$SUPERVISOR_PASSWORD

# Set this to a space separated list of addresses that should be allowed to load Appsmith in a frame.
# Example: "https://mydomain.com https://another-trusted-domain.com" will allow embedding on those two domains.
# Default value, if commented or not set, is "'none'", which disables embedding completely.
# https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors
APPSMITH_ALLOWED_FRAME_ANCESTORS="'self' *"

APPSMITH_DISABLE_IFRAME_WIDGET_SANDBOX=false

EOF
