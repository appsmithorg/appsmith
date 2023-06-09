#!/usr/bin/env bash

set -e
# ip is a reserved keyword for tracking events in Mixpanel. Instead of showing the ip as is Mixpanel provides derived properties.
# As we want derived props alongwith the ip address we are sharing the ip address in separate keys
# https://help.mixpanel.com/hc/en-us/articles/360001355266-Event-Properties
if [[ -n ${APPSMITH_SEGMENT_CE_KEY-} ]]; then
  ip="$(curl -sS https://api64.ipify.org || echo unknown)"
  curl \
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

  echo "Running appsmith for cloudRun"
  echo "Mounting File Sytem"
  mount -t nfs -o nolock "$FILESTORE_IP_ADDRESS:/$FILE_SHARE_NAME" /appsmith-stacks
  echo "Mounted File Sytem"
  echo "Setting HOSTNAME for Cloudrun"
  export HOSTNAME="cloudrun"
fi

stacks_path=/appsmith-stacks

function get_maximum_heap() {
    resource=$(ulimit -u)
    echo "Resource : $resource"
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
    bash "$TEMPLATES_PATH/docker.env.sh" "$default_appsmith_mongodb_user" "$generated_appsmith_mongodb_password" "$generated_appsmith_encryption_password" "$generated_appsmith_encription_salt" "$generated_appsmith_supervisor_password" > "$ENV_PATH"
  fi


  echo "Load environment configuration"
  set -o allexport
  . "$ENV_PATH"
  . "$TEMPLATES_PATH/pre-define.env"
  set +o allexport
}

setup_proxy_variables() {
  export NO_PROXY="${NO_PROXY-localhost,127.0.0.1}"

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
    MONGO_DB_PATH="$stacks_path/data/mongodb"
    MONGO_LOG_PATH="$MONGO_DB_PATH/log"
    MONGO_DB_KEY="$MONGO_DB_PATH/key"
    mkdir -p "$MONGO_DB_PATH"
    touch "$MONGO_LOG_PATH"

    if [[ ! -f "$MONGO_DB_KEY" ]]; then
      openssl rand -base64 756 > "$MONGO_DB_KEY"
    fi
    use-mongodb-key "$MONGO_DB_KEY"
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

  if [[ $isUriLocal -gt 0 && -f /proc/cpuinfo ]] && ! grep --quiet avx /proc/cpuinfo; then
    echo "====================================================================================================" >&2
    echo "==" >&2
    echo "== AVX instruction not found in your CPU. Appsmith's embedded MongoDB may not start. Please use an external MongoDB instance instead." >&2
    echo "== See https://docs.appsmith.com/getting-started/setup/instance-configuration/custom-mongodb-redis#custom-mongodb for instructions." >&2
    echo "==" >&2
    echo "====================================================================================================" >&2
  fi

  if [[ $shouldPerformInitdb -gt 0 && $isUriLocal -eq 0 ]]; then
    echo "Initializing Replica Set for local database"
    # Start installed MongoDB service - Dependencies Layer
    mongod --fork --port 27017 --dbpath "$MONGO_DB_PATH" --logpath "$MONGO_LOG_PATH"
    echo "Waiting 10s for MongoDB to start"
    sleep 10
    echo "Creating MongoDB user"
    mongosh "127.0.0.1/appsmith" --eval "db.createUser({
        user: '$APPSMITH_MONGODB_USER',
        pwd: '$APPSMITH_MONGODB_PASSWORD',
        roles: [{
            role: 'root',
            db: 'admin'
        }, 'readWrite']
      }
    )"
    echo "Enabling Replica Set"
    mongod --dbpath "$MONGO_DB_PATH" --shutdown || true
    mongod --fork --port 27017 --dbpath "$MONGO_DB_PATH" --logpath "$MONGO_LOG_PATH" --replSet mr1 --keyFile /mongodb-key --bind_ip localhost
    echo "Waiting 10s for MongoDB to start with Replica Set"
    sleep 10
    mongosh "$APPSMITH_MONGODB_URI" --eval 'rs.initiate()'
    mongod --dbpath "$MONGO_DB_PATH" --shutdown || true
  fi

  if [[ $isUriLocal -gt 0 ]]; then
    echo "Checking Replica Set of external MongoDB"

    if appsmithctl check-replica-set; then
      echo "MongoDB ReplicaSet is enabled"
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
  # This is a little weird. We copy the MongoDB key file to `/mongodb-key`, so that we can reliably set its permissions to 600.
  # What affects the reliability of this? When the host machine of this Docker container is Windows, file permissions cannot be set on files in volumes.
  # So the key file should be somewhere inside the container, and not in a volume.
  cp -v "$1" /mongodb-key
  chmod 600 /mongodb-key
}

# Keep Let's Encrypt directory persistent
mount_letsencrypt_directory() {
  echo "Mounting Let's encrypt directory"
  rm -rf /etc/letsencrypt
  mkdir -p /appsmith-stacks/{letsencrypt,ssl}
  ln -s /appsmith-stacks/letsencrypt /etc/letsencrypt
}

is_empty_directory() {
  [[ -d $1 && -z "$(ls -A "$1")" ]]
}

check_setup_custom_ca_certificates() {
  local stacks_ca_certs_path
  stacks_ca_certs_path="$stacks_path/ca-certs"

  local container_ca_certs_path
  container_ca_certs_path="/usr/local/share/ca-certificates"

  if [[ -d $stacks_ca_certs_path ]]; then
    if [[ ! -L $container_ca_certs_path ]]; then
      if is_empty_directory "$container_ca_certs_path"; then
        rmdir -v "$container_ca_certs_path"
      else
        echo "The 'ca-certificates' directory inside the container is not empty. Please clear it and restart to use certs from 'stacks/ca-certs' directory." >&2
        return
      fi
    fi

    ln --verbose --force --symbolic --no-target-directory "$stacks_ca_certs_path" "$container_ca_certs_path"

  elif [[ ! -e $container_ca_certs_path ]]; then
    rm -vf "$container_ca_certs_path"  # If it exists as a broken symlink, this will be needed.
    mkdir -v "$container_ca_certs_path"

  fi

  if [[ -n "$(ls "$stacks_ca_certs_path"/*.pem 2>/dev/null)" ]]; then
    echo "Looks like you have some '.pem' files in your 'ca-certs' folder. Please rename them to '.crt' to be picked up autatically.".
  fi

  update-ca-certificates --fresh
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
      # Initialize Redis rdb directory
      local redis_db_path="$stacks_path/data/redis"
      mkdir -p "$redis_db_path"
      # Enable saving Redis session data to disk more often, so recent sessions aren't cleared on restart.
      sed -i \
        -e 's/^save 60 10000$/save 15 1/g' \
        -e "s|^dir /var/lib/redis$|dir ${redis_db_path}|g" \
        /etc/redis/redis.conf
    fi
    if ! [[ -e "/appsmith-stacks/ssl/fullchain.pem" ]] || ! [[ -e "/appsmith-stacks/ssl/privkey.pem" ]]; then
      cp "$SUPERVISORD_CONF_PATH/cron.conf" /etc/supervisor/conf.d/
    fi
    if [[ $runEmbeddedPostgres -eq 1 ]]; then
      cp "$SUPERVISORD_CONF_PATH/postgres.conf" /etc/supervisor/conf.d/
      # Update hosts lookup to resolve to embedded postgres
      echo '127.0.0.1     mockdb.internal.appsmith.com' >> /etc/hosts
    fi

  fi
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

init_postgres() {
  # Initialize embedded postgres by default; set APPSMITH_ENABLE_EMBEDDED_DB to 0, to use existing cloud postgres mockdb instance
  if [[ ${APPSMITH_ENABLE_EMBEDDED_DB: -1} != 0 ]]; then
    echo ""
    echo "Checking initialized local postgres"
    POSTGRES_DB_PATH="$stacks_path/data/postgres/main"

    if [ -e "$POSTGRES_DB_PATH/PG_VERSION" ]; then
        echo "Found existing Postgres, Skipping initialization"
    else
      echo "Initializing local postgresql database"
      mkdir -p $POSTGRES_DB_PATH

      # Postgres does not allow it's server to be run with super user access, we use user postgres and the file system owner also needs to be the same user postgres
      chown postgres:postgres $POSTGRES_DB_PATH

      # Initialize the postgres db file system
      su -m postgres -c "/usr/lib/postgresql/13/bin/initdb -D $POSTGRES_DB_PATH"

      # Start the postgres server in daemon mode
      su postgres -c "/usr/lib/postgresql/13/bin/pg_ctl -D $POSTGRES_DB_PATH start"

      # Create mockdb db and user and populate it with the data
      seed_embedded_postgres
      # Stop the postgres daemon
      su postgres -c "/usr/lib/postgresql/13/bin/pg_ctl stop -D $POSTGRES_DB_PATH"
    fi
  else
    runEmbeddedPostgres=0
  fi

}

seed_embedded_postgres(){
    # Create mockdb database
    psql -U postgres -c "CREATE DATABASE mockdb;"
    # Create mockdb superuser
    su postgres -c "/usr/lib/postgresql/13/bin/createuser mockdb -s"
    # Dump the sql file containing mockdb data
    psql -U postgres -d mockdb --file='/opt/appsmith/templates/mockdb_postgres.sql'

    # Create users database
    psql -U postgres -c "CREATE DATABASE users;"
    # Create users superuser
    su postgres -c "/usr/lib/postgresql/13/bin/createuser users -s"
    # Dump the sql file containing mockdb data
    psql -U postgres -d users --file='/opt/appsmith/templates/users_postgres.sql'
}

safe_init_postgres(){
runEmbeddedPostgres=1
# fail safe to prevent entrypoint from exiting, and prevent postgres from starting
init_postgres || runEmbeddedPostgres=0
}

init_loading_pages(){
  # The default NGINX configuration includes an IPv6 listen directive. But not all
  # servers support it, and we don't need it. So we remove it here before starting
  # NGINX. 
  sed -i '/\[::\]:80 default_server;/d' /etc/nginx/sites-available/default  
  local starting_page="/opt/appsmith/templates/appsmith_starting.html"
  local initializing_page="/opt/appsmith/templates/appsmith_initializing.html"
  local editor_load_page="/opt/appsmith/editor/loading.html" 
  # Update default nginx page for initializing page
  cp "$initializing_page" /var/www/html/index.nginx-debian.html
  # Start nginx page to display the Appsmith is Initializing page
  nginx
  # Update editor nginx page for starting page
  cp "$starting_page" "$editor_load_page"
}

# Main Section
init_loading_pages
init_env_file
setup_proxy_variables
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
  # set the hostname for heroku dyno
  export HOSTNAME="heroku_dyno"
fi

check_setup_custom_ca_certificates
mount_letsencrypt_directory

check_redis_compatible_page_size

safe_init_postgres

configure_supervisord

CREDENTIAL_PATH="/etc/nginx/passwords"
if ! [[ -e "$CREDENTIAL_PATH" ]]; then
  echo "Generating Basic Authentication file"
  printf "$APPSMITH_SUPERVISOR_USER:$(openssl passwd -apr1 $APPSMITH_SUPERVISOR_PASSWORD)" > "$CREDENTIAL_PATH"
fi
# Ensure the restore path exists in the container, so an archive can be copied to it, if need be.
mkdir -p /appsmith-stacks/data/{backup,restore}

# Create sub-directory to store services log in the container mounting folder
mkdir -p /appsmith-stacks/logs/{backend,cron,editor,rts,mongodb,redis,postgres,appsmithctl}

# Stop nginx gracefully
nginx -s quit

# Handle CMD command
exec "$@"
