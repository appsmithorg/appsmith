#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset
set -o noglob

mode=mongo
if [[ "$APPSMITH_DB_URL" = postgresql://* ]]; then
  mode=pg
fi

tlog "Running with $mode."
cd "/opt/appsmith/server/$mode"

declare -a extra_args
proxy_configured=0

waitForPostgresAvailability() {
  if [ -z "$DB_HOST" ]; then
    tlog "PostgreSQL host name is empty. Check env variables. Error. Exiting java setup"
    exit 2
  else

    MAX_RETRIES=50
    RETRYSECONDS=10
    retry_count=0
    while true; do
      pg_isready -h "${DB_HOST}" -p "${DB_PORT}"
      status=$?

      case $status in
      0)
        echo "PostgreSQL host '${DB_HOST}' is ready."
        break
        ;;
      1)
        echo "PostgreSQL host '${DB_HOST}' is rejecting connections (e.g., due to being in recovery mode or not accepting connections eg. connections maxed out)."
        ;;
      2)
        echo "PostgreSQL host '${DB_HOST}' is not responding or running."
        ;;
      3)
        echo "The connection check failed (e.g., due to network issues or incorrect parameters)."
        ;;
      *)
        echo "pg_isready exited with unexpected status code: $status"
        break
        ;;
      esac

      retry_count=$((retry_count + 1))
      if [ $retry_count -le $MAX_RETRIES ]; then
        tlog "PostgreSQL connection failed. Retrying attempt $retry_count/$MAX_RETRIES in $RETRYSECONDS seconds..."
        sleep $RETRYSECONDS
      else
        tlog "Exceeded maximum retry attempts ($MAX_RETRIES). Exiting."
        # use exit code 2 to indicate that the script failed to connect to postgres and supervisor conf is set not to restart the program for 2.
        exit 2
      fi

    done
  fi
}

# for PostgreSQL, we use APPSMITH_DB_URL=postgresql://username:password@postgresserver:5432/dbname
# Args:
#     conn_string (string): PostgreSQL connection string
# Returns:
#     None
# Example:
#     postgres syntax
#       "postgresql://user:password@localhost:5432/appsmith"
#       "postgresql://user:password@localhost/appsmith"
#       "postgresql://user@localhost:5432/appsmith"
#       "postgresql://user@localhost/appsmith"
extract_postgres_db_params() {
  local conn_string=$1

  # Use node to parse the URI and extract components
  IFS=' ' read -r USER PASSWORD HOST PORT DB <<<$(node -e "
    const connectionString = process.argv[1];
    const pgUri = connectionString.startsWith(\"postgresql://\")
      ? connectionString
      : 'http://' + connectionString; //Prepend a fake scheme for URL parsing
    const url = require('url');
    const parsedUrl = new url.URL(pgUri);

    // Extract the pathname and remove the leading '/'
    const db = parsedUrl.pathname.substring(1);

    // Default the port to 5432 if it's empty
    const port = parsedUrl.port || '5432';

    console.log(\`\${parsedUrl.username || '-'} \${parsedUrl.password || '-'} \${parsedUrl.hostname} \${port} \${db}\`);
  " "$conn_string")

  # Now, set the environment variables
  export DB_USER="$USER"
  export DB_PASSWORD="$PASSWORD"
  export DB_HOST="$HOST"
  export DB_PORT="$PORT"
  export DB_NAME="$DB"
}

match-proxy-url() {
  # Examples:
  #   http://proxy.example.com:8080/
  #   http://user:pass@proxyhost:123
  #   http://proxyhost:123
  [[ $1 =~ ^http://(([^@:]*):([^@]*)?@)?([^@:]*):([0-9]+)/?$ ]]
  proxy_user="${BASH_REMATCH[2]-}"
  proxy_pass="${BASH_REMATCH[3]-}"
  proxy_host="${BASH_REMATCH[4]-}"
  proxy_port="${BASH_REMATCH[5]-}"
  [[ -n $proxy_host ]]
}

# Extract the database parameters from the APPSMITH_DB_URL and wait for the database to be available
if [[ "$mode" == "pg" ]]; then
  extract_postgres_db_params "$APPSMITH_DB_URL"
  waitForPostgresAvailability
fi

if match-proxy-url "${HTTP_PROXY-}"; then
  extra_args+=(-Dhttp.proxyHost="$proxy_host" -Dhttp.proxyPort="$proxy_port")
  if [[ -n $proxy_user ]]; then
    extra_args+=(-Dhttp.proxyUser="$proxy_user")
  fi
  if [[ -n $proxy_pass ]]; then
    extra_args+=(-Dhttp.proxyPassword="$proxy_pass")
  fi
  proxy_configured=1
fi

if match-proxy-url "${HTTPS_PROXY-}"; then
  extra_args+=(-Dhttps.proxyHost="$proxy_host" -Dhttps.proxyPort="$proxy_port")
  if [[ -n $proxy_user ]]; then
    extra_args+=(-Dhttps.proxyUser="$proxy_user")
  fi
  if [[ -n $proxy_pass ]]; then
    extra_args+=(-Dhttps.proxyPassword="$proxy_pass")
  fi
  proxy_configured=1
fi

if [[ -z "${NO_PROXY-}" ]]; then
  # A default for this value is set in entrypoint.sh script.
  # If this variable is not set, just set it to empty string.
  NO_PROXY=""
fi

if [[ $proxy_configured == 1 ]]; then
  extra_args+=(-Djava.net.useSystemProxies=true -Dhttp.nonProxyHosts="${NO_PROXY//,/|}")
fi

if [[ -f "$TMP/java-cacerts-opts" ]]; then
  extra_args+=("@$TMP/java-cacerts-opts")
fi

# Wait until RTS started and listens on port 8091
while ! curl --fail --silent localhost:"${APPSMITH_RTS_PORT:-8091}"/rts-api/v1/health-check; do
  tlog 'Waiting for RTS to start ...'
  sleep 1
done
tlog 'RTS started.'

sh /opt/appsmith/run-starting-page-init.sh &

# Ref -Dlog4j2.formatMsgNoLookups=true https://spring.io/blog/2021/12/10/log4j2-vulnerability-and-spring-boot
exec java ${APPSMITH_JAVA_ARGS:-} ${APPSMITH_JAVA_HEAP_ARG:-} \
  --add-opens java.base/java.time=ALL-UNNAMED \
  --add-opens java.base/java.nio=ALL-UNNAMED \
  -Dserver.port=8080 \
  -XX:+ShowCodeDetailsInExceptionMessages \
  -Djava.security.egd=file:/dev/./urandom \
  -Dlog4j2.formatMsgNoLookups=true \
  "${extra_args[@]}" \
  -jar server.jar
