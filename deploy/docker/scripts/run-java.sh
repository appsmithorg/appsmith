#!/bin/bash

# Ref -Dlog4j2.formatMsgNoLookups=true https://spring.io/blog/2021/12/10/log4j2-vulnerability-and-spring-boot
java_cmd="java ${APPSMITH_JAVA_ARGS:-} -Dserver.port=8082 -Djava.security.egd=file:/dev/./urandom -Dlog4j2.formatMsgNoLookups=true -jar server.jar"
exec $java_cmd