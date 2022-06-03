#!/bin/bash

set -o errexit
set -o pipefail
set -o nounset

http_proxy_host=""
http_proxy_port=""
https_proxy_host=""
https_proxy_port=""

if [[ ${HTTP_PROXY-} =~ ^http://(.*):(.*)$ ]]; then
  http_proxy_host="${BASH_REMATCH[1]}"
  http_proxy_port="${BASH_REMATCH[2]}"
fi

if [[ ${HTTPS_PROXY-} =~ ^http://(.*):(.*)$ ]]; then
  https_proxy_host="${BASH_REMATCH[1]}"
  https_proxy_port="${BASH_REMATCH[2]}"
fi

if ! isset NO_PROXY; then
  # A default for this value is set in entrypoint.sh script.
  NO_PROXY=""
fi

# Ref -Dlog4j2.formatMsgNoLookups=true https://spring.io/blog/2021/12/10/log4j2-vulnerability-and-spring-boot
exec java ${APPSMITH_JAVA_ARGS:-} ${APPSMITH_JAVA_HEAP_ARG:-} \
  -Dserver.port=8080 \
  -Djava.security.egd=file:/dev/./urandom \
  -Dlog4j2.formatMsgNoLookups=true \
  -Djava.net.useSystemProxies=true \
  -Dhttp.proxyHost="$http_proxy_host" \
  -Dhttp.proxyPort="$http_proxy_port" \
  -Dhttps.proxyHost="$https_proxy_host" \
  -Dhttps.proxyPort="$https_proxy_port" \
  -Dhttp.nonProxyHosts="${NO_PROXY/,/|}" \
  -jar server.jar
