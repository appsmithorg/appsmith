#!/bin/bash

set -e

GIT_SHA=$(eval git rev-parse HEAD)
echo $GIT_SHA
echo "Sentry Auth Token: $SENTRY_AUTH_TOKEN"

REACT_APP_SENTRY_RELEASE=$GIT_SHA REACT_APP_CLIENT_LOG_LEVEL=ERROR EXTEND_ESLINT=true craco --max-old-space-size=4096 build --config craco.build.config.js


if [ "$GITHUB_REPOSITORY" == "appsmithorg/appsmith-ee" ]; then
    echo "Deleting sourcemaps for EE"
    rm ./build/static/js/*.js.map
    rm ./build/static/js/*.js.map.gz
fi

echo "build finished"
