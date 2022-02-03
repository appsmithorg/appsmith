#!/bin/bash

set -o nounset

mongo_database="$1"
encoded_mongo_root_user="$2"
encoded_mongo_root_password="$3"
mongo_host="$4"
disable_telemetry="$5"

cat << EOF
# Read our documentation on how to configure these features
# https://docs.appsmith.com/v/v1.2.1/setup/docker#enabling-services-for-self-hosting

# ***** Email **********
APPSMITH_MAIL_ENABLED=false
# APPSMITH_MAIL_FROM=YOUR_VERIFIED_EMAIL_ID
# APPSMITH_REPLY_TO=YOUR_VERIFIED_EMAIL_ID
# APPSMITH_MAIL_HOST=
# APPSMITH_MAIL_PORT=
# ***** Set to true if providing a TLS port ******
# APPSMITH_MAIL_SMTP_TLS_ENABLED=
# APPSMITH_MAIL_USERNAME=
# APPSMITH_MAIL_PASSWORD=
# APPSMITH_MAIL_SMTP_AUTH=true
# ******************************

# ******** Google OAuth ********
# APPSMITH_OAUTH2_GOOGLE_CLIENT_ID=
# APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET=
# ******************************

# ********* Github OAUth **********
# APPSMITH_OAUTH2_GITHUB_CLIENT_ID=
# APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET=
# *********************************

# ******** Google Maps ***********
# APPSMITH_GOOGLE_MAPS_API_KEY=
# ********************************

# ******** Database *************
APPSMITH_REDIS_URL=redis://redis:6379
APPSMITH_MONGODB_URI=mongodb://$encoded_mongo_root_user:$encoded_mongo_root_password@$mongo_host/$mongo_database?retryWrites=true&authSource=admin
MONGO_INITDB_DATABASE=$mongo_database
MONGO_INITDB_ROOT_USERNAME=$encoded_mongo_root_user
MONGO_INITDB_ROOT_PASSWORD=$encoded_mongo_root_password
# *******************************

# *** EE Specific Config ********
# APPSMITH_MARKETPLACE_URL=
# APPSMITH_RAPID_API_KEY_VALUE=
# APPSMITH_ROLLBAR_ACCESS_TOKEN=
# APPSMITH_ROLLBAR_ENV=
# APPSMITH_SEGMENT_KEY=
# *******************************

# ******** ANALYTICS *************
APPSMITH_DISABLE_TELEMETRY=$disable_telemetry
# *******************************

# ****** MAX PAYLOAD SIZE *******
# APPSMITH_CODEC_SIZE=
# *******************************

# ***** Google Recaptcha Config ******
# APPSMITH_RECAPTCHA_SITE_KEY=
# APPSMITH_RECAPTCHA_SECRET_KEY=
# APPSMITH_RECAPTCHA_ENABLED=
# ************************************

# ******** INTERCOM *************
# APPSMITH_DISABLE_INTERCOM=
# *******************************

# APPSMITH_PLUGIN_MAX_RESPONSE_SIZE_MB=5

EOF
