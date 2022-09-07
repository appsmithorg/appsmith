#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset
set -o noglob

declare -a proxy_args
proxy_configured=0

if [[ ${HTTP_PROXY-} =~ ^http://(.*):(.*)$ && ${BASH_REMATCH[2]} != 0 ]]; then
  proxy_args+=(-Dhttp.proxyHost="${BASH_REMATCH[1]}" -Dhttp.proxyPort="${BASH_REMATCH[2]}")
  proxy_configured=1
fi

if [[ ${HTTPS_PROXY-} =~ ^https?://(.*):(.*)$ && ${BASH_REMATCH[2]} != 0 ]]; then
  proxy_args+=(-Dhttps.proxyHost="${BASH_REMATCH[1]}" -Dhttps.proxyPort="${BASH_REMATCH[2]}")
  proxy_configured=1
fi

if [[ -z "${NO_PROXY-}" ]]; then
  # A default for this value is set in entrypoint.sh script.
  # If this variable is not set, just set it to empty string.
  NO_PROXY=""
fi

if [[ $proxy_configured == 1 ]]; then
  proxy_args+=(-Djava.net.useSystemProxies=true -Dhttp.nonProxyHosts="${NO_PROXY/,/|}")
fi

# Ref -Dlog4j2.formatMsgNoLookups=true https://spring.io/blog/2021/12/10/log4j2-vulnerability-and-spring-boot
exec java ${APPSMITH_JAVA_ARGS:-} ${APPSMITH_JAVA_HEAP_ARG:-} \
  -Dserver.port=8080 \
  -Djava.security.egd=file:/dev/./urandom \
  -Dlog4j2.formatMsgNoLookups=true \
  "${proxy_args[@]}" \
  -jar server.jar
