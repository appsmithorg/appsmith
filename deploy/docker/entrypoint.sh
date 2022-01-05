#!/usr/bin/env bash

set -e

init_env_file() {
  CONF_PATH="/appsmith-stacks/configuration"
  ENV_PATH="$CONF_PATH/docker.env"
  TEMPLATES_PATH="/opt/appsmith/templates"
  echo "Initialize .env file"
  if ! [[ -e "$ENV_PATH" ]]; then
    # Generate new docker.env file when initializing container for first time or in Heroku which does not have persistent volume
    echo "Generating default configuration file"
    mkdir -p "$CONF_PATH"
    AUTO_GEN_MONGO_PASSWORD=$(
      tr -dc A-Za-z0-9 </dev/urandom | head -c 13
      echo ''
    )
    AUTO_GEN_ENCRYPTION_PASSWORD=$(
      tr -dc A-Za-z0-9 </dev/urandom | head -c 13
      echo ''
    )
    AUTO_GEN_ENCRYPTION_SALT=$(
      tr -dc A-Za-z0-9 </dev/urandom | head -c 13
      echo ''
    )
    bash "$TEMPLATES_PATH/docker.env.sh" > "$TEMPLATES_PATH/docker.env.temp"
    
    if [[ -z "${APPSMITH_DISABLE_TELEMETRY}" ]]; then
      export APPSMITH_DISABLE_TELEMETRY=false
    fi

    if [[ -z "${APPSMITH_MONGODB_URI}" ]]; then
      export APPSMITH_MONGODB_URI=mongodb://appsmith:$AUTO_GEN_MONGO_PASSWORD@localhost/appsmith
    fi

    if [[ -z "${APPSMITH_REDIS_URL}" ]]; then
      export APPSMITH_REDIS_URL=redis://127.0.0.1:6379
    fi

    if [[ -z "${APPSMITH_ENCRYPTION_PASSWORD}" ]]; then
      export APPSMITH_ENCRYPTION_PASSWORD=$AUTO_GEN_ENCRYPTION_PASSWORD
    fi

    if [[ -z "$APPSMITH_ENCRYPTION_SALT" ]]; then
      export APPSMITH_ENCRYPTION_SALT=$AUTO_GEN_ENCRYPTION_SALT
    fi
    cat "$TEMPLATES_PATH/docker.env.temp" | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z0-9_]+'))" | sed -e 's|\$APPSMITH_[A-Z0-9_]*||g' > "$ENV_PATH"
  else
    # Write existing environment variables which is loaded by predefined/system environment variables (ConfigMap in K8S/Docker environment file)
    echo "Generating configuration file based on config from system environment variables"
    bash "$TEMPLATES_PATH/docker.env.sh" > "$TEMPLATES_PATH/docker.env.temp"
    
    echo 'Load former environment configuration'
    set -o allexport
    . "$ENV_PATH"
    set +o allexport

    echo "Write former environment variables into temporary .env"
    cat "$TEMPLATES_PATH/docker.env.temp" | envsubst "$(printf '$%s,' $(env | grep -Eo '^APPSMITH_[A-Z0-9_]+'))" | sed -e 's|\$APPSMITH_[A-Z0-9_]*||g' > "$ENV_PATH"
  fi
}

load_configuration() {
  if [[ -f "$ENV_PATH" ]]; then
    sed -i 's/APPSMITH_MONGO_USERNAME/MONGO_INITDB_ROOT_USERNAME/; s/APPSMITH_MONGO_PASSWORD/MONGO_INITDB_ROOT_PASSWORD/; s/APPSMITH_MONGO_DATABASE/MONGO_INITDB_DATABASE/' "$ENV_PATH"
    echo 'Load environment configuration'
    set -o allexport
    . "$ENV_PATH"
    set +o allexport
  fi
}

unset_unused_variables() {
  # Check for enviroment vairalbes
  echo 'Checking environment configuration'
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
}

check_initialized_db() {
  echo 'Check initialized database'
  shouldPerformInitdb=1
  for path in \
    "$MONGO_DB_PATH/WiredTiger" \
    "$MONGO_DB_PATH/journal" \
    "$MONGO_DB_PATH/local.0" \
    "$MONGO_DB_PATH/storage.bson"; do
    if [ -e "$path" ]; then
      shouldPerformInitdb=0
      return
    fi
  done
  echo "Should initialize database"
}

init_mongodb() {
  echo "Init database"
  MONGO_DB_PATH="/appsmith-stacks/data/mongodb"
  MONGO_LOG_PATH="$MONGO_DB_PATH/log"
  MONGO_DB_KEY="$MONGO_DB_PATH/key"
  mkdir -p "$MONGO_DB_PATH"
  touch "$MONGO_LOG_PATH"

  check_initialized_db

  if [[ $shouldPerformInitdb -gt 0 ]]; then
    # Start installed MongoDB service - Dependencies Layer
    mongod --fork --port 27017 --dbpath "$MONGO_DB_PATH" --logpath "$MONGO_LOG_PATH"
    echo "Waiting 10s for mongodb init"
    sleep 10
    bash "/opt/appsmith/templates/mongo-init.js.sh" "$MONGO_INITDB_ROOT_USERNAME" "$MONGO_INITDB_ROOT_PASSWORD" >"/appsmith-stacks/configuration/mongo-init.js"
    mongo "127.0.0.1/${MONGO_INITDB_DATABASE}" /appsmith-stacks/configuration/mongo-init.js
    echo "Seeding db done"

    echo "Enable replica set"
    mongod --dbpath "$MONGO_DB_PATH" --shutdown || true
    echo "Fork process"
    openssl rand -base64 756 >"$MONGO_DB_KEY"
    chmod go-rwx,u-wx "$MONGO_DB_KEY"
    mongod --fork --port 27017 --dbpath "$MONGO_DB_PATH" --logpath "$MONGO_LOG_PATH" --replSet mr1 --keyFile "$MONGO_DB_KEY" --bind_ip localhost
    echo "Waiting 10s for mongodb init with replica set"
    sleep 10
    mongo "$APPSMITH_MONGODB_URI" --eval 'rs.initiate()'
    mongod --dbpath "$MONGO_DB_PATH" --shutdown || true
  fi
}

# Keep Let's Encrypt directory persistent 
mount_letsencrypt_directory() { 
  echo "Mounting Let's encrypt directory"
  rm -rf /etc/letsencrypt
  mkdir -p /appsmith-stacks/{letsencrypt,ssl}
  ln -s /appsmith-stacks/letsencrypt /etc/letsencrypt
}

configure_supervisord() {
  SUPERVISORD_CONF_PATH="/opt/appsmith/templates/supervisord"
  if [[ -n "$(ls -A /etc/supervisor/conf.d)" ]]; then
    rm -f "/etc/supervisor/conf.d/"*
  fi

  cp -f "$SUPERVISORD_CONF_PATH/application_process/"*.conf /etc/supervisor/conf.d

  # Disable services based on configuration
  if [[ "$APPSMITH_MONGODB_URI" = "mongodb://appsmith:$MONGO_INITDB_ROOT_PASSWORD@localhost/appsmith" ]]; then
    cp "$SUPERVISORD_CONF_PATH/mongodb.conf" /etc/supervisor/conf.d/
  fi
  if [[ "$APPSMITH_REDIS_URL" = "redis://127.0.0.1:6379" ]]; then
    cp "$SUPERVISORD_CONF_PATH/redis.conf" /etc/supervisor/conf.d/
    # Enable saving Redis session data to disk more often, so recent sessions aren't cleared on restart.
    sed -i 's/^# save 60 10000$/save 60 1/g' /etc/redis/redis.conf
  fi
  if ! [[ -e "/appsmith-stacks/ssl/fullchain.pem" ]] || ! [[ -e "/appsmith-stacks/ssl/privkey.pem" ]]; then
    cp "$SUPERVISORD_CONF_PATH/cron.conf" /etc/supervisor/conf.d/
  fi
}

# Main Section
init_env_file
load_configuration
unset_unused_variables
init_mongodb
mount_letsencrypt_directory
configure_supervisord

# Ensure the restore path exists in the container, so an archive can be copied to it, if need be.
mkdir -p /appsmith-stacks/data/{backup,restore}

# Create sub-directory to store services log in the container mounting folder
mkdir -p /appsmith-stacks/logs/{backend,cron,editor,rts,mongodb,redis}

# Handle CMD command
exec "$@"
