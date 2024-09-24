#!/usr/bin/env bash

set -e

tlog "Running as: $(id)"

stacks_path=/appsmith-stacks

export SUPERVISORD_CONF_TARGET="$TMP/supervisor-conf.d/"  # export for use in supervisord.conf
export MONGODB_TMP_KEY_PATH="$TMP/mongodb-key"  # export for use in supervisor process mongodb.conf

mkdir -pv "$SUPERVISORD_CONF_TARGET" "$WWW_PATH"

setup_proxy_variables() {
  export NO_PROXY="${NO_PROXY-localhost,127.0.0.1}"

  # Ensure `localhost` and `127.0.0.1` are in always present in `NO_PROXY`.
  local no_proxy_lines
  no_proxy_lines="$(echo "$NO_PROXY" | tr , \\n)"
  if ! echo "$no_proxy_lines" | grep -q '^localhost$'; then
    export NO_PROXY="localhost,$NO_PROXY"
  fi
  if ! echo "$no_proxy_lines" | grep -q '^127.0.0.1$'; then
    export NO_PROXY="127.0.0.1,$NO_PROXY"
  fi

  # If one of HTTPS_PROXY or https_proxy are set, copy it to the other. If both are set, prefer HTTPS_PROXY.
  if [[ -n ${HTTPS_PROXY-} ]]; then
    export https_proxy="$HTTPS_PROXY"
  elif [[ -n ${https_proxy-} ]]; then
    export HTTPS_PROXY="$https_proxy"
  fi

  # If one of HTTP_PROXY or http_proxy are set, copy it to the other. If both are set, prefer HTTP_PROXY.
  if [[ -n ${HTTP_PROXY-} ]]; then
    export http_proxy="$HTTP_PROXY"
  elif [[ -n ${http_proxy-} ]]; then
    export HTTP_PROXY="$http_proxy"
  fi
}


init_env_file() {
  CONF_PATH="/appsmith-stacks/configuration"
  ENV_PATH="$CONF_PATH/docker.env"
  TEMPLATES_PATH="/opt/appsmith/templates"

  if [[ -n "$APPSMITH_MONGODB_URI" ]]; then
    export APPSMITH_DB_URL="$APPSMITH_MONGODB_URI"
    unset APPSMITH_MONGODB_URI
  fi

  # Build an env file with current env variables. We single-quote the values, as well as escaping any single-quote characters.
  printenv | grep -E '^APPSMITH_|^MONGO_' | sed "s/'/'\\\''/g; s/=/='/; s/$/'/" > "$TMP/pre-define.env"

  tlog "Initialize .env file"
  if ! [[ -e "$ENV_PATH" ]]; then
    # Generate new docker.env file when initializing container for first time or in Heroku which does not have persistent volume
    tlog "Generating default configuration file"
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
    bash "$TEMPLATES_PATH/docker.env.sh" "$default_appsmith_mongodb_user" "$generated_appsmith_mongodb_password" "$generated_appsmith_encryption_password" "$generated_appsmith_encription_salt" "$generated_appsmith_supervisor_password" > "$ENV_PATH"
  fi


  tlog "Load environment configuration"

  # Load the ones in `docker.env` in the stacks folder.
  set -o allexport
  . "$ENV_PATH"
  set +o allexport

  if [[ -n "$APPSMITH_MONGODB_URI" ]]; then
    export APPSMITH_DB_URL="$APPSMITH_MONGODB_URI"
    unset APPSMITH_MONGODB_URI
  fi

  # Load the ones set from outside, should take precedence, and so will overwrite anything from `docker.env` above.
  set -o allexport
  . "$TMP/pre-define.env"
  set +o allexport
}

init_env_file
setup_proxy_variables

# ip is a reserved keyword for tracking events in Mixpanel. Instead of showing the ip as is Mixpanel provides derived properties.
# As we want derived props alongwith the ip address we are sharing the ip address in separate keys
# https://help.mixpanel.com/hc/en-us/articles/360001355266-Event-Properties
if [[ -n ${APPSMITH_SEGMENT_CE_KEY-} ]]; then
  ip="$(set -o pipefail; curl --connect-timeout 5 -sS https://cs.appsmith.com/api/v1/ip | grep -Eo '\d+(\.\d+){3}' || echo "unknown")"
  curl \
    --connect-timeout 5 \
    --user "$APPSMITH_SEGMENT_CE_KEY:" \
    --header 'Content-Type: application/json' \
    --data '{
      "userId":"'"$ip"'",
      "event":"Instance Start",
      "properties": {
        "ip": "'"$ip"'",
        "ipAddress": "'"$ip"'"
      }
    }' \
    https://api.segment.io/v1/track \
    || true
fi

if [[ -n "${FILESTORE_IP_ADDRESS-}" ]]; then

  ## Trim APPSMITH_FILESTORE_IP and FILE_SHARE_NAME
  FILESTORE_IP_ADDRESS="$(echo "$FILESTORE_IP_ADDRESS" | xargs)"
  FILE_SHARE_NAME="$(echo "$FILE_SHARE_NAME" | xargs)"

  tlog "Running appsmith for cloudRun"
  tlog "creating mount point"
  mkdir -p "$stacks_path"
  tlog "Mounting File Sytem"
  mount -t nfs -o nolock "$FILESTORE_IP_ADDRESS:/$FILE_SHARE_NAME" /appsmith-stacks
  tlog "Mounted File Sytem"
  tlog "Setting HOSTNAME for Cloudrun"
  export HOSTNAME="cloudrun"
fi


function get_maximum_heap() {
    resource=$(ulimit -u)
    tlog "Resource : $resource"
    if [[ "$resource" -le 256 ]]; then
        maximum_heap=128
    elif [[ "$resource" -le 512 ]]; then
        maximum_heap=256
    fi
}

function setup_backend_heap_arg() {
    if [[ ! -z ${maximum_heap} ]]; then
      export APPSMITH_JAVA_HEAP_ARG="-Xmx${maximum_heap}m"
    fi
}

unset_unused_variables() {
  # Check for enviroment vairalbes
  tlog "Checking environment configuration"
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

  export APPSMITH_SUPERVISOR_USER="${APPSMITH_SUPERVISOR_USER:-appsmith}"
  if [[ -z "${APPSMITH_SUPERVISOR_PASSWORD-}" ]]; then
    APPSMITH_SUPERVISOR_PASSWORD="$(tr -dc A-Za-z0-9 </dev/urandom | head -c 13)"
    export APPSMITH_SUPERVISOR_PASSWORD
  fi
}

configure_database_connection_url() {
  tlog "Configuring database connection URL"
  isPostgresUrl=0
  isMongoUrl=0

  if [[ "${APPSMITH_DB_URL}" == "postgresql:"* ]]; then
    isPostgresUrl=1
  elif [[ "${APPSMITH_DB_URL}" == "mongodb"* ]]; then
    isMongoUrl=1
  fi
}

check_db_uri() {
  tlog "Checking APPSMITH_DB_URL"
  isUriLocal=1
  if [[ $APPSMITH_DB_URL == *"localhost"* || $APPSMITH_DB_URL == *"127.0.0.1"* ]]; then
    tlog "Detected local DB"
    isUriLocal=0
  fi
}

init_mongodb() {
  if [[ $isUriLocal -eq 0 ]]; then
    tlog "Initializing local database"
    MONGO_DB_PATH="$stacks_path/data/mongodb"
    MONGO_LOG_PATH="$MONGO_DB_PATH/log"
    MONGO_DB_KEY="$MONGO_DB_PATH/key"
    mkdir -p "$MONGO_DB_PATH"
    touch "$MONGO_LOG_PATH"

    if [[ ! -f "$MONGO_DB_KEY" ]]; then
      openssl rand -base64 756 > "$MONGO_DB_KEY"
    fi
    use-mongodb-key "$MONGO_DB_KEY"

    ./mongodb-fixer.sh &
  fi
}

init_replica_set() {
  tlog "Checking initialized database"
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

  if [[ $isUriLocal -gt 0 && -f /proc/cpuinfo ]] && ! grep --quiet avx /proc/cpuinfo; then
    tlog "====================================================================================================" >&2
    tlog "==" >&2
    tlog "== AVX instruction not found in your CPU. Appsmith's embedded MongoDB may not start. Please use an external MongoDB instance instead." >&2
    tlog "== See https://docs.appsmith.com/getting-started/setup/instance-configuration/custom-mongodb-redis#custom-mongodb for instructions." >&2
    tlog "==" >&2
    tlog "====================================================================================================" >&2
  fi

  if [[ $shouldPerformInitdb -gt 0 && $isUriLocal -eq 0 ]]; then
    tlog "Initializing Replica Set for local database"
    # Start installed MongoDB service - Dependencies Layer
    mongod --fork --port 27017 --dbpath "$MONGO_DB_PATH" --logpath "$MONGO_LOG_PATH"
    tlog "Waiting 10s for MongoDB to start"
    sleep 10
    tlog "Creating MongoDB user"
    mongosh "127.0.0.1/appsmith" --eval "db.createUser({
        user: '$APPSMITH_MONGODB_USER',
        pwd: '$APPSMITH_MONGODB_PASSWORD',
        roles: [{
            role: 'root',
            db: 'admin'
        }, 'readWrite']
      }
    )"
    tlog "Enabling Replica Set"
    mongod --dbpath "$MONGO_DB_PATH" --shutdown || true
    mongod --fork --port 27017 --dbpath "$MONGO_DB_PATH" --logpath "$MONGO_LOG_PATH" --replSet mr1 --keyFile "$MONGODB_TMP_KEY_PATH" --bind_ip localhost
    tlog "Waiting 10s for MongoDB to start with Replica Set"
    sleep 10
    mongosh "$APPSMITH_DB_URL" --eval 'rs.initiate()'
    mongod --dbpath "$MONGO_DB_PATH" --shutdown || true
  fi

  if [[ $isUriLocal -gt 0 ]]; then
    tlog "Checking Replica Set of external MongoDB"

    if appsmithctl check-replica-set; then
      tlog "MongoDB ReplicaSet is enabled"
    else
      echo -e "\033[0;31m***************************************************************************************\033[0m"
      echo -e "\033[0;31m*      MongoDB Replica Set is not enabled                                             *\033[0m"
      echo -e "\033[0;31m*      Please ensure the credentials provided for MongoDB, has 'readWrite' role.      *\033[0m"
      echo -e "\033[0;31m***************************************************************************************\033[0m"
      exit 1
    fi
  fi
}

use-mongodb-key() {
  # We copy the MongoDB key file to `$MONGODB_TMP_KEY_PATH`, so that we can reliably set its permissions to 600.
  # Why? When the host machine of this Docker container is Windows, file permissions cannot be set on files in volumes.
  # So the key file should be somewhere inside the container, and not in a volume.
  mkdir -pv "$(dirname "$MONGODB_TMP_KEY_PATH")"
  cp -v "$1" "$MONGODB_TMP_KEY_PATH"
  chmod 600 "$MONGODB_TMP_KEY_PATH"
}

is_empty_directory() {
  [[ -d $1 && -z "$(ls -A "$1")" ]]
}

check_setup_custom_ca_certificates() {
  # old, deprecated, should be removed.
  local stacks_ca_certs_path
  stacks_ca_certs_path="$stacks_path/ca-certs"

  local container_ca_certs_path
  container_ca_certs_path="/usr/local/share/ca-certificates"

  if [[ -d $stacks_ca_certs_path ]]; then
    if [[ ! -L $container_ca_certs_path ]]; then
      if is_empty_directory "$container_ca_certs_path"; then
        rmdir -v "$container_ca_certs_path"
      else
        tlog "The 'ca-certificates' directory inside the container is not empty. Please clear it and restart to use certs from 'stacks/ca-certs' directory." >&2
        return
      fi
    fi

    ln --verbose --force --symbolic --no-target-directory "$stacks_ca_certs_path" "$container_ca_certs_path"

  elif [[ ! -e $container_ca_certs_path ]]; then
    rm -vf "$container_ca_certs_path"  # If it exists as a broken symlink, this will be needed.
    mkdir -v "$container_ca_certs_path"

  fi

  update-ca-certificates --fresh
}

setup-custom-ca-certificates() (
  local stacks_ca_certs_path="$stacks_path/ca-certs"
  local store="$TMP/cacerts"
  local opts_file="$TMP/java-cacerts-opts"

  rm -f "$store" "$opts_file"

  if [[ -n "$(ls "$stacks_ca_certs_path"/*.pem 2>/dev/null)" ]]; then
    tlog "Looks like you have some '.pem' files in your 'ca-certs' folder. Please rename them to '.crt' to be picked up automatically.".
  fi

  if ! [[ -d "$stacks_ca_certs_path" && "$(find "$stacks_ca_certs_path" -maxdepth 1 -type f -name '*.crt' | wc -l)" -gt 0 ]]; then
    tlog "No custom CA certificates found."
    return
  fi

  # Import the system CA certificates into the store.
  keytool -importkeystore \
    -srckeystore /opt/java/lib/security/cacerts \
    -destkeystore "$store" \
    -srcstorepass changeit \
    -deststorepass changeit

  # Add the custom CA certificates to the store.
  find -L "$stacks_ca_certs_path" -maxdepth 1 -type f -name '*.crt' \
    -print \
    -exec keytool -import -alias '{}' -noprompt -keystore "$store" -file '{}' -storepass changeit ';'

  {
    echo "-Djavax.net.ssl.trustStore=$store"
    echo "-Djavax.net.ssl.trustStorePassword=changeit"
  } > "$opts_file"
)

configure_supervisord() {
  local supervisord_conf_source="/opt/appsmith/templates/supervisord"
  if [[ -n "$(ls -A "$SUPERVISORD_CONF_TARGET")" ]]; then
    rm -f "$SUPERVISORD_CONF_TARGET"/*
  fi

  cp -f "$supervisord_conf_source"/application_process/*.conf "$SUPERVISORD_CONF_TARGET"

  # Disable services based on configuration
  if [[ -z "${DYNO}" ]]; then
    if [[ $isUriLocal -eq 0 && $isMongoUrl -eq 1 ]]; then
      cp "$supervisord_conf_source/mongodb.conf" "$SUPERVISORD_CONF_TARGET"
    fi
    if [[ $APPSMITH_REDIS_URL == *"localhost"* || $APPSMITH_REDIS_URL == *"127.0.0.1"* ]]; then
      cp "$supervisord_conf_source/redis.conf" "$SUPERVISORD_CONF_TARGET"
      mkdir -p "$stacks_path/data/redis"
    fi
    if [[ $runEmbeddedPostgres -eq 1 ]]; then
      cp "$supervisord_conf_source/postgres.conf" "$SUPERVISORD_CONF_TARGET"
    fi
  fi

}

# This is a workaround to get Redis working on different memory pagesize
# https://github.com/appsmithorg/appsmith/issues/11773
check_redis_compatible_page_size() {
  local page_size
  page_size="$(getconf PAGE_SIZE)"
  if [[ $page_size -gt 4096 ]]; then
    curl \
    --connect-timeout 5 \
      --silent \
      --user "$APPSMITH_SEGMENT_CE_KEY:" \
      --header 'Content-Type: application/json' \
      --data '{ "userId": "'"$HOSTNAME"'", "event":"RedisCompile" }' \
      https://api.segment.io/v1/track \
      || true
    tlog "Compile Redis stable with page size of $page_size"
    apt-get update
    apt-get install --yes build-essential
    curl --connect-timeout 5 --location https://download.redis.io/redis-stable.tar.gz | tar -xz -C /tmp
    pushd /tmp/redis-stable
    make
    make install
    popd
    rm -rf /tmp/redis-stable
  else
    tlog "Redis is compatible with page size of $page_size"
  fi
}

init_postgres() {
  # Initialize embedded postgres by default; set APPSMITH_ENABLE_EMBEDDED_DB to 0, to use existing cloud postgres mockdb instance
  if [[ ${APPSMITH_ENABLE_EMBEDDED_DB: -1} != 0 ]]; then
    tlog "Checking initialized local postgres"
    POSTGRES_DB_PATH="$stacks_path/data/postgres/main"

    mkdir -p "$POSTGRES_DB_PATH" "$TMP/pg-runtime"

    # Postgres does not allow it's server to be run with super user access, we use user postgres and the file system owner also needs to be the same user postgres
    chown -R postgres:postgres "$POSTGRES_DB_PATH" "$TMP/pg-runtime"

    if [[ -e "$POSTGRES_DB_PATH/PG_VERSION" ]]; then
      /opt/appsmith/pg-upgrade.sh
    else
      tlog "Initializing local Postgres data folder"
      su postgres -c "env PATH='$PATH' initdb -D $POSTGRES_DB_PATH"
    fi
  else
    runEmbeddedPostgres=0
  fi

}

safe_init_postgres() {
  runEmbeddedPostgres=1
  # fail safe to prevent entrypoint from exiting, and prevent postgres from starting
  # when runEmbeddedPostgres=0 , postgres conf file for supervisord will not be copied
  # so postgres will not be started by supervisor. Explicit message helps us to know upgrade script failed.

  if init_postgres; then
    tlog "init_postgres succeeded."
  else
    local exit_status=$?
    tlog "init_postgres failed with exit status $exit_status."
    runEmbeddedPostgres=0
  fi
}

setup_caddy() {
  if [[ "$APPSMITH_RATE_LIMIT" == "disabled" ]]; then
    export _APPSMITH_CADDY="/opt/caddy/caddy_vanilla"
  else
    export _APPSMITH_CADDY="/opt/caddy/caddy"
  fi
}

init_loading_pages(){
  export XDG_DATA_HOME=/appsmith-stacks/data  # so that caddy saves tls certs and other data under stacks/data/caddy
  export XDG_CONFIG_HOME=/appsmith-stacks/configuration
  mkdir -p "$XDG_DATA_HOME" "$XDG_CONFIG_HOME"
  cp templates/loading.html "$WWW_PATH"
  node caddy-reconfigure.mjs
  "$_APPSMITH_CADDY" start --config "$TMP/Caddyfile"
}

function setup_auto_heal(){
   if [[ ${APPSMITH_AUTO_HEAL-} = 1 ]]; then
     # By default APPSMITH_AUTO_HEAL=0
     # To enable auto heal set APPSMITH_AUTO_HEAL=1
     bash /opt/appsmith/auto_heal.sh $APPSMITH_AUTO_HEAL_CURL_TIMEOUT >> "$APPSMITH_LOG_DIR"/cron/auto_heal.log 2>&1 &
   fi
}

function setup_monitoring(){
   if [[ ${APPSMITH_MONITORING-} = 1 ]]; then
     # By default APPSMITH_MONITORING=0
     # To enable auto heal set APPSMITH_MONITORING=1
     bash /opt/appsmith/JFR-recording-24-hours.sh $APPSMITH_LOG_DIR 2>&1 &
   fi
}

print_appsmith_info(){
  tr '\n' ' ' < /opt/appsmith/info.json
}

function capture_infra_details(){
  bash /opt/appsmith/generate-infra-details.sh || true
}

# Main Section
print_appsmith_info
setup_caddy
init_loading_pages
unset_unused_variables

configure_database_connection_url
check_db_uri
# Don't run MongoDB if running in a Heroku dyno.
if [[ -z "${DYNO}" ]]; then
  if [[ $isMongoUrl -eq 1 ]]; then
    # Setup MongoDB and initialize replica set
    tlog "Initializing MongoDB"
    init_mongodb
    init_replica_set
  fi
else
  # These functions are used to limit heap size for Backend process when deployed on Heroku
  get_maximum_heap
  setup_backend_heap_arg
  # set the hostname for heroku dyno
  export HOSTNAME="heroku_dyno"
fi

check_setup_custom_ca_certificates
setup-custom-ca-certificates

check_redis_compatible_page_size

safe_init_postgres

configure_supervisord

# Ensure the restore path exists in the container, so an archive can be copied to it, if need be.
mkdir -p /appsmith-stacks/data/{backup,restore} /appsmith-stacks/ssl

# Create sub-directory to store services log in the container mounting folder
export APPSMITH_LOG_DIR="${APPSMITH_LOG_DIR:-/appsmith-stacks/logs}"
mkdir -p "$APPSMITH_LOG_DIR"/{supervisor,backend,cron,editor,rts,mongodb,redis,postgres,appsmithctl}

setup_auto_heal
capture_infra_details
setup_monitoring || echo true

# Handle CMD command
exec "$@"
