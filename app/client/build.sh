#!/bin/sh

set -e

GIT_SHA=$(eval git rev-parse HEAD)
echo $GIT_SHA
echo "Sentry Auth Token: $SENTRY_AUTH_TOKEN"

REACT_APP_SENTRY_RELEASE=$GIT_SHA EXTEND_ESLINT=true craco --max-old-space-size=4096 build --config craco.build.config.js

rm ./build/static/js/*.js.map
echo "build finished"
