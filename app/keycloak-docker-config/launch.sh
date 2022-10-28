#!/bin/bash

if [ "x$WILDFLY_HOME" = "x" ]; then
    WILDFLY_HOME="/opt/keycloak"
fi

if [[ "$1" == "domain" ]]; then
    $WILDFLY_HOME/bin/domain.sh -c $2 -b $3 -Djboss.socket.binding.port-offset=1 
else
    $WILDFLY_HOME/bin/standalone.sh -c $2 -b $3 -Djboss.socket.binding.port-offset=1
fi
