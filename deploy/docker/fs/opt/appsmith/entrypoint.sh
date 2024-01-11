#!/usr/bin/env bash

set -e

echo "Running as: $(id)"

stacks_path=/appsmith-stacks

export SUPERVISORD_CONF_TARGET="$TMP/supervisor-conf.d/"  # export for use in supervisord.conf
export MONGODB_TMP_KEY_PATH="$TMP/mongodb-key"  # export for use in supervisor process mongodb.conf

mkdir -pv "$SUPERVISORD_CONF_TARGET" "$WWW_PATH"

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
  echo "creating mount point"
  mkdir -p "$stacks_path"
  echo "Mounting File Sytem"
  mount -t nfs -o nolock "$FILESTORE_IP_ADDRESS:/$FILE_SHARE_NAME" /appsmith-stacks
  echo "Mounted File Sytem"
  echo "Setting HOSTNAME for Cloudrun"
  export HOSTNAME="cloudrun"
fi


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
  printenv | grep -E '^APPSMITH_|^MONGO_' | sed "s/'/'\\\''/g; s/=/='/; s/$/'/" > "$TMP/pre-define.env"

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
  . "$TMP/pre-define.env"
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

setup_cdn_variable() {
  # Ensure APPSMITH_CDN_URL always ends with a trailing /
  if [[ -n "${APPSMITH_CDN_URL:-}" ]]; then
    local cdn_url="$(echo "$APPSMITH_CDN_URL" | sed 's,//*$,,')"
    export APPSMITH_CDN_URL="${cdn_url}/"
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

  if [[ -z "${APPSMITH_OAUTH2_OIDC_CLIENT_ID}" ]] || [[ -z "${APPSMITH_OAUTH2_OIDC_CLIENT_SECRET}" ]]; then
    unset APPSMITH_OAUTH2_OIDC_CLIENT_ID # If this field is empty is might cause application crash
    unset APPSMITH_OAUTH2_OIDC_CLIENT_SECRET
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

    ./mongodb-fixer.sh &
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
    mongod --fork --port 27017 --dbpath "$MONGO_DB_PATH" --logpath "$MONGO_LOG_PATH" --replSet mr1 --keyFile "$MONGODB_TMP_KEY_PATH" --bind_ip localhost
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
  # We copy the MongoDB key file to `$MONGODB_TMP_KEY_PATH`, so that we can reliably set its permissions to 600.
  # Why? When the host machine of this Docker container is Windows, file permissions cannot be set on files in volumes.
  # So the key file should be somewhere inside the container, and not in a volume.
  mkdir -pv "$(dirname "$MONGODB_TMP_KEY_PATH")"
  cp -v "$1" "$MONGODB_TMP_KEY_PATH"
  chmod 600 "$MONGODB_TMP_KEY_PATH"
}

init_keycloak() {
  # Add default values as env variable in script to start keycloak (Used only docker deployment)
  # These values are computed in helmchart for kubernetes deployment

  KC_DB="${APPSMITH_KEYCLOAK_DB_DRIVER-dev-file}"
  if [[ $KC_DB == h2 ]]; then
    KC_DB="dev-file"
  elif [[ $KC_DB == postgresql ]]; then
    KC_DB="postgres"
  fi
  export KC_DB

  if [[ $KC_DB == "postgres" ]]; then
    KC_DB_URL="$APPSMITH_KEYCLOAK_DB_URL"
    if [[ $KC_DB_URL != jdbc:* ]]; then
      KC_DB_URL="jdbc:postgresql://$KC_DB_URL"
    fi
    export KC_DB_URL
    export KC_DB_USERNAME="${APPSMITH_KEYCLOAK_DB_USERNAME-}"
    export KC_DB_PASSWORD="${APPSMITH_KEYCLOAK_DB_PASSWORD-}"
  fi

  if [[ -z ${KEYCLOAK_ADMIN_USERNAME-} ]]; then
    export KEYCLOAK_ADMIN_USERNAME=admin
    echo $'\nKEYCLOAK_ADMIN_USERNAME='"$KEYCLOAK_ADMIN_USERNAME" >> "$stacks_path/configuration/docker.env"
  fi

  if [[ -z ${KEYCLOAK_ADMIN_PASSWORD-} ]]; then
    KEYCLOAK_ADMIN_PASSWORD="$(
      tr -dc A-Za-z0-9 </dev/urandom | head -c 13
      echo ""
    )"
    export KEYCLOAK_ADMIN_PASSWORD
    echo "KEYCLOAK_ADMIN_PASSWORD=$KEYCLOAK_ADMIN_PASSWORD" >> "$stacks_path/configuration/docker.env"
  fi

  # Make keycloak persistent across reboots
  ln --verbose --force --symbolic --no-target-directory /appsmith-stacks/data/keycloak /opt/keycloak/data/h2

  # Migrate Keycloak v16 data to Keycloak v20.
  if [[ -f /appsmith-stacks/data/keycloak/keycloak.mv.db ]]; then
    if ! keycloak_migrate_h2_to_v2; then
      echo "WARNING: Failed to migrate Keycloak data to v2 format. Will attempt again at next restart."
    fi
  fi
  if [[ -f /appsmith-stacks/data/keycloak/keycloakdb.mv.db && ! -f /appsmith-stacks/data/keycloak/keycloakdb.lock.db ]]; then
    java -classpath /opt/keycloak/lib/lib/main/com.h2database.h2-*.jar org.h2.tools.Shell \
      -url jdbc:h2:/appsmith-stacks/data/keycloak/keycloakdb \
      -user sa \
      -password password \
      -sql 'SELECT H2VERSION() FROM DUAL' \
      &> /dev/null \
      || keycloak_migrate_h2_to_v3 \
      || echo "WARNING: Failed to migrate Keycloak data to v3 format. Will attempt again at next restart."
  fi
}

keycloak_migrate_h2_to_v2() {
  # Start Appsmith v1.9.5, configure SAML, login using SAML, then upgrade to a version that contains Keycloak v20, and
  # this block should migrate the Keycloak data accurately. SAML should work on that Appsmith, out-of-the-box.
  echo "Migrating Keycloak H2 v1 data to H2 v2."
  local old_h2_jar=/tmp/h2-1.4.197.jar
  test -f "$old_h2_jar" \
    || curl --location --output "$old_h2_jar" 'https://search.maven.org/remotecontent?filepath=com/h2database/h2/1.4.197/h2-1.4.197.jar'
  export_file=/appsmith-stacks/data/kc-export.sql
  # Export the Keycloak data from the old H2 database.
  java -classpath "$old_h2_jar" \
    org.h2.tools.Script \
    -url jdbc:h2:/appsmith-stacks/data/keycloak/keycloak \
    -user sa \
    -password sa \
    -script "$export_file"
  # The export file generated by H2 v1 doesn't quote keywords, and Keycloak uses the keyword "VALUE" as a column name.
  # So we apply a transformation on the export file to quote the keyword "VALUE".
  gawk -i inplace '
    (/^INSERT INTO / || /^ALTER TABLE / || /^CREATE / || in_create) && !/"VALUE"/ { gsub(/\<VALUE\>/, "\"VALUE\"") }
    /^CREATE / && /\($/ { in_create = 1 }
    in_create && $1 == ");" { in_create = 0 }
    { print }
  ' "$export_file"
  # Import the Keycloak data into the new H2 database.
  java -classpath /opt/keycloak/lib/lib/main/com.h2database.h2-2.1.214.jar \
    org.h2.tools.RunScript \
    -url jdbc:h2:/appsmith-stacks/data/keycloak/keycloakdb \
    -user sa \
    -password password \
    -script "$export_file"
  rm -vf \
    /appsmith-stacks/data/keycloak/keycloak.{mv,trace}.db \
    "$old_h2_jar"
}

keycloak_migrate_h2_to_v3() {
  # Start Appsmith v1.9.34, configure SAML, login using SAML, then upgrade to a version that contains Keycloak v22, and
  # this block should migrate the Keycloak data accurately. SAML should work on that Appsmith, out-of-the-box.
  # Ref: <https://theappsmith.slack.com/archives/C02K2MZERSL/p1693216606776449>.
  echo "Migrating Keycloak H2 v2 data to H2 v3."
  local old_h2_jar=/opt/h2-2.1.214.jar
  local export_file=/appsmith-stacks/data/kc-export-v2.sql
  local db_loc=/appsmith-stacks/data/keycloak/keycloakdb
  # Export the Keycloak data from the old H2 database.
  java -classpath "$old_h2_jar" \
    org.h2.tools.Script \
    -url "jdbc:h2:$db_loc" \
    -user sa \
    -password password \
    -script "$export_file"
  # Delete the old H2 database and the old H2 jar.
  rm -vf "$db_loc".{mv,trace}.db
  # Import the Keycloak data into the new H2 database.
  java -classpath /opt/keycloak/lib/lib/main/com.h2database.h2-2.2.*.jar \
    org.h2.tools.RunScript \
    -url "jdbc:h2:$db_loc" \
    -user sa \
    -password password \
    -script "$export_file"
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
        echo "The 'ca-certificates' directory inside the container is not empty. Please clear it and restart to use certs from 'stacks/ca-certs' directory." >&2
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
    echo "Looks like you have some '.pem' files in your 'ca-certs' folder. Please rename them to '.crt' to be picked up automatically.".
  fi

  if ! [[ -d "$stacks_ca_certs_path" && "$(find "$stacks_ca_certs_path" -maxdepth 1 -type f -name '*.crt' | wc -l)" -gt 0 ]]; then
    echo "No custom CA certificates found."
    return
  fi

  # Import the system CA certificates into the store.
  keytool -importkeystore \
    -srckeystore /opt/java/lib/security/cacerts \
    -destkeystore "$store" \
    -srcstorepass changeit \
    -deststorepass changeit

  # Add the custom CA certificates to the store.
  find "$stacks_ca_certs_path" -maxdepth 1 -type f -name '*.crt' \
    -print \
    -exec keytool -import -alias '{}' -noprompt -keystore "$store" -file '{}' -storepass changeit ';'

  {
    echo "-Djavax.net.ssl.trustStore=$store"
    echo "-Djavax.net.ssl.trustStorePassword=changeit"
  } > "$opts_file"

  # Get certbot to use the combined trusted CA certs file.
  export REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
)

configure_supervisord() {
  local supervisord_conf_source="/opt/appsmith/templates/supervisord"
  if [[ -n "$(ls -A "$SUPERVISORD_CONF_TARGET")" ]]; then
    rm -f "$SUPERVISORD_CONF_TARGET"/*
  fi

  cp -f "$supervisord_conf_source"/application_process/*.conf "$SUPERVISORD_CONF_TARGET"

  # Disable services based on configuration
  if [[ -z "${DYNO}" ]]; then
    if [[ $isUriLocal -eq 0 ]]; then
      cp "$supervisord_conf_source/mongodb.conf" "$SUPERVISORD_CONF_TARGET"
    fi
    if [[ $APPSMITH_REDIS_URL == *"localhost"* || $APPSMITH_REDIS_URL == *"127.0.0.1"* ]]; then
      cp "$supervisord_conf_source/redis.conf" "$SUPERVISORD_CONF_TARGET"
      mkdir -p "$stacks_path/data/redis"
    fi
    if [[ -z "$APPSMITH_TEMPORAL_URL" || $APPSMITH_TEMPORAL_URL == *"localhost"* || $APPSMITH_TEMPORAL_URL == *"127.0.0.1"* ]]; then
      cp "$supervisord_conf_source/temporal.conf" "$SUPERVISORD_CONF_TARGET"
      mkdir -p "$stacks_path/data/temporal"
    fi
    if [[ $runEmbeddedPostgres -eq 1 ]]; then
      cp "$supervisord_conf_source/postgres.conf" "$SUPERVISORD_CONF_TARGET"
    fi
  fi

  if [[ ${APPSMITH_DISABLE_EMBEDDED_KEYCLOAK-0} != 1 ]]; then
    # By default APPSMITH_DISABLE_EMBEDDED_KEYCLOAK=0
    # To disable set APPSMITH_DISABLE_EMBEDDED_KEYCLOAK=1
    cp "$supervisord_conf_source/keycloak.conf" "$SUPERVISORD_CONF_TARGET"
  fi
}

# This is a workaround to get Redis working on different memory pagesize
# https://github.com/appsmithorg/appsmith/issues/11773
check_redis_compatible_page_size() {
  local page_size
  page_size="$(getconf PAGE_SIZE)"
  if [[ $page_size -gt 4096 ]]; then
    curl \
      --silent \
      --user "$APPSMITH_SEGMENT_CE_KEY:" \
      --header 'Content-Type: application/json' \
      --data '{ "userId": "'"$HOSTNAME"'", "event":"RedisCompile" }' \
      https://api.segment.io/v1/track \
      || true
    echo "Compile Redis stable with page size of $page_size"
    apt-get update
    apt-get install --yes build-essential
    curl --location https://download.redis.io/redis-stable.tar.gz | tar -xz -C /tmp
    pushd /tmp/redis-stable
    make
    make install
    popd
    rm -rf /tmp/redis-stable
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
        chown -R postgres:postgres "$POSTGRES_DB_PATH"
    else
      echo "Initializing local postgresql database"
      mkdir -p "$POSTGRES_DB_PATH"

      # Postgres does not allow it's server to be run with super user access, we use user postgres and the file system owner also needs to be the same user postgres
      chown postgres:postgres "$POSTGRES_DB_PATH"

      # Initialize the postgres db file system
      su postgres -c "/usr/lib/postgresql/13/bin/initdb -D $POSTGRES_DB_PATH"

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
  export XDG_DATA_HOME=/appsmith-stacks/data  # so that caddy saves tls certs and other data under stacks/data/caddy
  export XDG_CONFIG_HOME=/appsmith-stacks/configuration
  mkdir -p "$XDG_DATA_HOME" "$XDG_CONFIG_HOME"
  cp templates/loading.html "$WWW_PATH"
  node caddy-reconfigure.mjs
  /opt/caddy/caddy start --config "$TMP/Caddyfile"
}

function setup_auto_heal(){
   if [[ ${APPSMITH_AUTO_HEAL-} = 1 ]]; then
     # By default APPSMITH_AUTO_HEAL=0
     # To enable auto heal set APPSMITH_AUTO_HEAL=1
     bash /opt/appsmith/auto_heal.sh $APPSMITH_AUTO_HEAL_CURL_TIMEOUT >> /appsmith-stacks/logs/cron/auto_heal.log 2>&1 &
   fi
}

# Main Section
init_loading_pages
init_env_file
setup_proxy_variables
setup_cdn_variable
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

init_keycloak

check_setup_custom_ca_certificates
setup-custom-ca-certificates

check_redis_compatible_page_size

safe_init_postgres

configure_supervisord

# Ensure the restore path exists in the container, so an archive can be copied to it, if need be.
mkdir -p /appsmith-stacks/data/{backup,restore,keycloak}

# Create sub-directory to store services log in the container mounting folder
mkdir -p /appsmith-stacks/logs/{supervisor,backend,cron,editor,rts,mongodb,redis,postgres,appsmithctl}
mkdir -p /appsmith-stacks/logs/{keycloak,temporal}

setup_auto_heal

# Handle CMD command
exec "$@"
