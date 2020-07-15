#!/bin/sh

if [ -f docker-compose.yml ]
  then
    echo "file docker-compose.yml already exists"
  else
    touch docker-compose.yml
fi

cat > docker.env  << EOF
# Read our documentation on how to configure these features
# https://docs.appsmith.com/v/v1.1/enabling-3p-services

# ***** Email **********
APPSMITH_MAIL_ENABLED=false
# APPSMITH_MAIL_HOST=
# APPSMITH_MAIL_PASSWORD=
# APPSMITH_MAIL_PORT=
# APPSMITH_MAIL_SMTP_AUTH=
# APPSMITH_MAIL_SMTP_TLS_ENABLED=
# APPSMITH_MAIL_USERNAME=
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
APPSMITH_MONGODB_URI=mongodb://$mongo_root_user:$mongo_root_password@$mongo_host/appsmith?retryWrites=true
# *******************************

# *** EE Specific Config ********
# APPSMITH_MARKETPLACE_URL=
# APPSMITH_RAPID_API_KEY_VALUE=
# APPSMITH_ROLLBAR_ACCESS_TOKEN=
# APPSMITH_ROLLBAR_ENV=
# APPSMITH_SEGMENT_KEY=
# *******************************

EOF
