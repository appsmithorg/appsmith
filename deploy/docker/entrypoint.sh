#!/usr/bin/env bash

set -e

function get_maximum_heap(){ 
    resource=$(ulimit -u)
    echo "Resource : $resource"
    if [[ "$resource" -le 256 ]]; then
        maximum_heap=128
    elif [[ "$resource" -le 512 ]]; then
        maximum_heap=256
    fi
}

function setup_backend_heap_arg(){
    if [[ ! -z ${maximum_heap} ]]; then
      export APPSMITH_JAVA_HEAP_ARG="-Xmx${maximum_heap}m"
    fi
}

init_env_file() {
  CONF_PATH="/appsmith-stacks/configuration"
  ENV_PATH="$CONF_PATH/docker.env"
  TEMPLATES_PATH="/opt/appsmith/templates"

  # Build an env file with current env variables. We single-quote the values, as well as escaping any single-quote characters.
  printenv | grep -E '^APPSMITH_|^MONGO_' | sed "s/'/'\"'\"'/; s/=/='/; s/$/'/" > "$TEMPLATES_PATH/pre-define.env"
  
  echo "Initialize .env file"
  if ! [[ -e "$ENV_PATH" ]]; then
    # Generate new docker.env file when initializing container for first time or in Heroku which does not have persistent volume
    echo "Generating default configuration file"
    mkdir -p "$CONF_PATH"
    local default_appsmith_mongodb_user="appsmith"
    local generated_appsmith_mongodb_password=$(
      tr -dc A-Za-z0-9 </dev/urandom | head -c 13
      echo ""
    )
    local generated_appsmith_encryption_password=$(
      tr -dc A-Za-z0-9 </dev/urandom | head -c 13
      echo ""
    )
    local generated_appsmith_encription_salt=$(
      tr -dc A-Za-z0-9 </dev/urandom | head -c 13
      echo ""
    )
    local generated_appsmith_supervisor_password=$(
      tr -dc A-Za-z0-9 </dev/urandom | head -c 13
      echo ''
    )
    local generated_keycloak_password=$(
      tr -dc A-Za-z0-9 </dev/urandom | head -c 13
      echo ""
    )

    bash "$TEMPLATES_PATH/docker.env.sh" "$default_appsmith_mongodb_user" "$generated_appsmith_mongodb_password" "$generated_appsmith_encryption_password" "$generated_appsmith_encription_salt" "$generated_appsmith_supervisor_password" "$generated_keycloak_password" > "$ENV_PATH"
  fi


  echo "Load environment configuration"
  set -o allexport
  . "$ENV_PATH"
  . "$TEMPLATES_PATH/pre-define.env"
  set +o allexport
}

unset_unused_variables() {
  # Check for enviroment vairalbes
  echo "Checking environment configuration"
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

  if [[ -z "${APPSMITH_OAUTH2_OIDC_CLIENT_ID}" ]] || [[ -z "${APPSMITH_OAUTH2_OIDC_CLIENT_SECRET}" ]]; then
    unset APPSMITH_OAUTH2_OIDC_CLIENT_ID # If this field is empty is might cause application crash
    unset APPSMITH_OAUTH2_OIDC_CLIENT_SECRET
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

check_mongodb_uri() {
  echo "Checking APPSMITH_MONGODB_URI"
  isUriLocal=1
  if [[ $APPSMITH_MONGODB_URI == *"localhost"* || $APPSMITH_MONGODB_URI == *"127.0.0.1"* ]]; then
    echo "Detected local MongoDB"
    isUriLocal=0
  fi
}

init_mongodb() {
  if [[ $isUriLocal -eq 0 ]]; then
    echo "Initializing local database"
    MONGO_DB_PATH="/appsmith-stacks/data/mongodb"
    MONGO_LOG_PATH="$MONGO_DB_PATH/log"
    MONGO_DB_KEY="$MONGO_DB_PATH/key"
    mkdir -p "$MONGO_DB_PATH"
    touch "$MONGO_LOG_PATH"

    if [[ -f "$MONGO_DB_KEY" ]]; then
      chmod-mongodb-key "$MONGO_DB_KEY"
    fi
  fi
}

init_replica_set() {
  echo "Checking initialized database"
  shouldPerformInitdb=1
  for path in \
    "$MONGO_DB_PATH/WiredTiger" \
    "$MONGO_DB_PATH/journal" \
    "$MONGO_DB_PATH/local.0" \
    "$MONGO_DB_PATH/storage.bson"; do
    if [ -e "$path" ]; then
      shouldPerformInitdb=0
      break
    fi
  done

  if [[ $shouldPerformInitdb -gt 0 && $isUriLocal -eq 0 ]]; then
    echo "Initializing Replica Set for local database"
    # Start installed MongoDB service - Dependencies Layer
    mongod --fork --port 27017 --dbpath "$MONGO_DB_PATH" --logpath "$MONGO_LOG_PATH"
    echo "Waiting 10s for MongoDB to start"
    sleep 10
    echo "Creating MongoDB user"
    bash "/opt/appsmith/templates/mongo-init.js.sh" "$APPSMITH_MONGODB_USER" "$APPSMITH_MONGODB_PASSWORD" > "/appsmith-stacks/configuration/mongo-init.js"
    mongo "127.0.0.1/appsmith" /appsmith-stacks/configuration/mongo-init.js
    echo "Enabling Replica Set"
    mongod --dbpath "$MONGO_DB_PATH" --shutdown || true
    openssl rand -base64 756 > "$MONGO_DB_KEY"
    chmod-mongodb-key "$MONGO_DB_KEY"
    mongod --fork --port 27017 --dbpath "$MONGO_DB_PATH" --logpath "$MONGO_LOG_PATH" --replSet mr1 --keyFile "$MONGO_DB_KEY" --bind_ip localhost
    echo "Waiting 10s for MongoDB to start with Replica Set"
    sleep 10
    mongo "$APPSMITH_MONGODB_URI" --eval 'rs.initiate()'
    mongod --dbpath "$MONGO_DB_PATH" --shutdown || true
  fi

  if [[ $isUriLocal -gt 0 ]]; then
    # Check mongodb cloud Replica Set
    echo "Checking Replica Set of external MongoDB"

    if appsmithctl check_replica_set; then
      echo "Mongodb cloud Replica Set is enabled"
    else
      echo -e "\033[0;31m********************************************************************\033[0m"
      echo -e "\033[0;31m*          MongoDB Replica Set is not enabled                      *\033[0m"
      echo -e "\033[0;31m********************************************************************\033[0m"
      exit 1
    fi
  fi
}

chmod-mongodb-key() {
  chmod 600 "$1"
}

init_keycloak() {
  
  /opt/keycloak/bin/add-user-keycloak.sh --user "$KEYCLOAK_ADMIN_USERNAME" --password "$KEYCLOAK_ADMIN_PASSWORD"

  # Make keycloak persistent across reboots
  ln -s /appsmith-stacks/data/keycloak /opt/keycloak/standalone/data
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
  if [[ -z "${DYNO}" ]]; then
    if [[ $isUriLocal -eq 0 ]]; then
      cp "$SUPERVISORD_CONF_PATH/mongodb.conf" /etc/supervisor/conf.d/
    fi
    if [[ $APPSMITH_REDIS_URL == *"localhost"* || $APPSMITH_REDIS_URL == *"127.0.0.1"* ]]; then
      cp "$SUPERVISORD_CONF_PATH/redis.conf" /etc/supervisor/conf.d/
      # Enable saving Redis session data to disk more often, so recent sessions aren't cleared on restart.
      sed -i 's/^# save 60 10000$/save 60 1/g' /etc/redis/redis.conf
    fi
    if ! [[ -e "/appsmith-stacks/ssl/fullchain.pem" ]] || ! [[ -e "/appsmith-stacks/ssl/privkey.pem" ]]; then
      cp "$SUPERVISORD_CONF_PATH/cron.conf" /etc/supervisor/conf.d/
    fi
  fi

  # copy keycloak configuration without any conditions.
  cp "$SUPERVISORD_CONF_PATH/keycloak.conf" /etc/supervisor/conf.d/
}

# This is a workaround to get Redis working on diffent memory pagesize
# https://github.com/appsmithorg/appsmith/issues/11773
check_redis_compatible_page_size() {
  local page_size
  page_size="$(getconf PAGE_SIZE)"
  if [[ $page_size -gt 4096 ]]; then
    echo "Compile Redis stable with page size of $page_size"
    echo "Downloading Redis source..."
    curl https://download.redis.io/redis-stable.tar.gz -L | tar xvz
    cd redis-stable/
    echo "Compiling Redis from source..."
    make && make install
    echo "Cleaning up Redis source..."
    cd ..
    rm -rf redis-stable/
  else
    echo "Redis is compatible with page size of $page_size"
  fi
}

# Main Section
init_env_file
unset_unused_variables
check_mongodb_uri
if [[ -z "${DYNO}" ]]; then
  # Don't run MongoDB if running in a Heroku dyno.
  init_mongodb
  init_replica_set
else 
  # These functions are used to limit heap size for Backend process when deployed on Heroku
  get_maximum_heap
  setup_backend_heap_arg
fi
init_keycloak
mount_letsencrypt_directory
check_redis_compatible_page_size
configure_supervisord

CREDENTIAL_PATH="/etc/nginx/passwords"
if ! [[ -e "$CREDENTIAL_PATH" ]]; then
  echo "Generating Basic Authentication file"
  printf "$APPSMITH_SUPERVISOR_USER:$(openssl passwd -apr1 $APPSMITH_SUPERVISOR_PASSWORD)" > "$CREDENTIAL_PATH"
fi
# Ensure the restore path exists in the container, so an archive can be copied to it, if need be.
mkdir -p /appsmith-stacks/data/{backup,restore,keycloak}

# Create sub-directory to store services log in the container mounting folder
mkdir -p /appsmith-stacks/logs/{backend,cron,editor,rts,mongodb,redis,keycloak}

# Handle CMD command
exec "$@"
