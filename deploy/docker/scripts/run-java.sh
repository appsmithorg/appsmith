#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset
set -o noglob

declare -a proxy_args
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

if match-proxy-url "${HTTP_PROXY-}"; then
  proxy_args+=(-Dhttp.proxyHost="$proxy_host" -Dhttp.proxyPort="$proxy_port")
  if [[ -n $proxy_user ]]; then
    proxy_args+=(-Dhttp.proxyUser="$proxy_user")
  fi
  if [[ -n $proxy_pass ]]; then
    proxy_args+=(-Dhttp.proxyPassword="$proxy_pass")
  fi
  proxy_configured=1
fi

if match-proxy-url "${HTTPS_PROXY-}"; then
  proxy_args+=(-Dhttps.proxyHost="$proxy_host" -Dhttps.proxyPort="$proxy_port")
  if [[ -n $proxy_user ]]; then
    proxy_args+=(-Dhttps.proxyUser="$proxy_user")
  fi
  if [[ -n $proxy_pass ]]; then
    proxy_args+=(-Dhttps.proxyPassword="$proxy_pass")
  fi
  proxy_configured=1
fi

if [[ -z "${NO_PROXY-}" ]]; then
  # A default for this value is set in entrypoint.sh script.
  # If this variable is not set, just set it to empty string.
  NO_PROXY=""
fi

if [[ $proxy_configured == 1 ]]; then
  proxy_args+=(-Djava.net.useSystemProxies=true -Dhttp.nonProxyHosts="${NO_PROXY//,/|}")
fi

# Wait until RTS started and listens on port 8091
while ! curl --fail --silent localhost/rts-api/v1/health-check; do
  echo 'Waiting for RTS to start ...'
  sleep 1
done
echo 'RTS started.'


# Ref -Dlog4j2.formatMsgNoLookups=true https://spring.io/blog/2021/12/10/log4j2-vulnerability-and-spring-boot
exec java ${APPSMITH_JAVA_ARGS:-} ${APPSMITH_JAVA_HEAP_ARG:-} \
  --add-opens java.base/java.time=ALL-UNNAMED \
  -Dserver.port=8080 \
  -Djava.security.egd=file:/dev/./urandom \
  -Dlog4j2.formatMsgNoLookups=true \
  "${proxy_args[@]}" \
  -jar server.jar
