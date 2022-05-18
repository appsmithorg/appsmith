#!/bin/sh

set -e

GIT_SHA=$(eval git rev-parse HEAD)
echo $GIT_SHA
echo "Sentry Auth Token: $SENTRY_AUTH_TOKEN"

REACT_APP_SENTRY_RELEASE=$GIT_SHA REACT_APP_CLIENT_LOG_LEVEL=ERROR EXTEND_ESLINT=true vite build

rm -rf build/**/*.js.map
echo "build finished"
