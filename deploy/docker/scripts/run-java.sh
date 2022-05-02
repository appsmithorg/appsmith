#!/bin/bash

# Ref -Dlog4j2.formatMsgNoLookups=true https://spring.io/blog/2021/12/10/log4j2-vulnerability-and-spring-boot
exec java ${APPSMITH_JAVA_ARGS:-} ${APPSMITH_JAVA_HEAP_ARG:-} -Dserver.port=8080 -Djava.security.egd=file:/dev/./urandom -Dlog4j2.formatMsgNoLookups=true -jar server.jar