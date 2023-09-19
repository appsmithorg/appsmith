#!/bin/bash

set -e

GIT_SHA=$(eval git rev-parse HEAD)
echo $GIT_SHA
echo "Sentry Auth Token: $SENTRY_AUTH_TOKEN"

if [ "$REACT_APP_AIRGAP_ENABLED" == "true" ]; then
    echo "Building for airgapped Appsmith instances"
    node download-assets.js;
    OUTPUT_PATH=build_airgap
else
    echo "Building for non-airgapped Appsmith instances"
    OUTPUT_PATH=build
fi

# build cra app
export REACT_APP_SENTRY_RELEASE=$GIT_SHA
export REACT_APP_CLIENT_LOG_LEVEL=ERROR
# Disable CRA built-in ESLint checks since we have our own config and a separate step for this
export DISABLE_ESLINT_PLUGIN=true
craco --max-old-space-size=7168 build --config craco.build.config.js

if [ "$GITHUB_REPOSITORY" == "appsmithorg/appsmith-ee" ]; then
    echo "Deleting sourcemaps for EE"
    rm ./$OUTPUT_PATH/static/js/*.js.map
    rm ./$OUTPUT_PATH/static/js/*.js.map.gz
fi

echo "build finished"
