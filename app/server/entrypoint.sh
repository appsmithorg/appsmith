#!/bin/sh

# Add an `authSource` query param to MongoDB URI, if missing.
if [ -n "$APPSMITH_MONGODB_URI" ]; then
  if ! echo "$APPSMITH_MONGODB_URI" | grep -Fq "authSource="; then
    if echo "$APPSMITH_MONGODB_URI" | grep -Fq '?'; then
      APPSMITH_MONGODB_URI="$APPSMITH_MONGODB_URI&authSource=admin"
    else
      APPSMITH_MONGODB_URI="$APPSMITH_MONGODB_URI?authSource=admin"
    fi
  fi
fi

# Ref -Dlog4j2.formatMsgNoLookups=true https://spring.io/blog/2021/12/10/log4j2-vulnerability-and-spring-boot
exec java -Djava.security.egd="file:/dev/./urandom" "$@" -Dlog4j2.formatMsgNoLookups=true -jar server.jar
