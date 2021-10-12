#!/bin/sh
exec java -Djava.security.egd="file:/dev/./urandom" "$@" -jar server.jar
