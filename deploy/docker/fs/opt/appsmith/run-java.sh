#!/bin/bash

# Source the helper script
source pg-utils.sh

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
  sh /opt/appsmith/pg-default-schema.sh &
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
