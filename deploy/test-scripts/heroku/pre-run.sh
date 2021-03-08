#!/bin/bash

set -e

# Install heroku
curl https://cli-assets.heroku.com/install.sh | sh

# Heroku authentication
cat >~/.netrc <<EOF
machine api.heroku.com
  login $HEROKU_USERNAME
  password $HEROKU_API_KEY
machine git.heroku.com
  login $HEROKU_USERNAME
  password $HEROKU_API_KEY
EOF

chmod 600 ~/.netrc

# Set name of app heroku
app_name=gu-appsmith
echo "$app_name" >app_name.txt

# Create app
heroku create $app_name

# Create Redis add-on
heroku addons:create heroku-redis:hobby-dev --as=APPSMITH_REDIS -a $app_name

# Config environment variables
heroku config:set APPSMITH_ENCRYPTION_PASSWORD=test -a $app_name
heroku config:set APPSMITH_ENCRYPTION_SALT=testing123 -a $app_name
heroku config:set APPSMITH_MONGODB_URI=$MONGO_URI -a $app_name
heroku config:set APPSMITH_MAIL_ENABLED=false -a $app_name
heroku config:set APPSMITH_MAIL_FROM= -a $app_name
heroku config:set APPSMITH_REPLY_TO= -a $app_name
heroku config:set APPSMITH_MAIL_HOST= -a $app_name
heroku config:set APPSMITH_MAIL_USERNAME= -a $app_name
heroku config:set APPSMITH_MAIL_PASSWORD= -a $app_name
heroku config:set APPSMITH_OAUTH2_GOOGLE_CLIENT_ID= -a $app_name
heroku config:set APPSMITH_OAUTH2_GOOGLE_CLIENT_SECRET= -a $app_name
heroku config:set APPSMITH_OAUTH2_GITHUB_CLIENT_ID= -a $app_name
heroku config:set APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET= -a $app_name
heroku config:set APPSMITH_GOOGLE_MAPS_API_KEY= -a $app_name
heroku config:set APPSMITH_DISABLE_TELEMETRY=false -a $app_name
heroku config:set APPSMITH_SEGMENT_CE_KEY= -a $app_name

# Deploy
heroku git:remote -a $app_name
heroku stack:set container
git fetch --unshallow
git push heroku -f HEAD:refs/heads/master

# Get app info
echo "App information: "
heroku apps:info -a $app_name

# Get app domain
heroku info $app_name -s | grep web_url | cut -d= -f2 | sed 's/.$//' >domain.txt

# Wait for app to start
wait_for_containers_start() {
  local timeout=$1

  while [[ $timeout -gt 0 ]]; do
    echo "Waiting for heroku app to start. This check will timeout in $timeout seconds..."
    ((timeout--))
    sleep 1
  done
}

wait_for_containers_start 300
