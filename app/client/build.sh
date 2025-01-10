#!/bin/bash

set -e

GIT_SHA=$(eval git rev-parse HEAD)
echo $GIT_SHA
echo "Sentry Auth Token: $SENTRY_AUTH_TOKEN"

if [ "$REACT_APP_AIRGAP_ENABLED" == "true" ]; then
    echo "Building for airgapped Appsmith instances"
    node download-assets.js;
else
    echo "Building for non-airgapped Appsmith instances"
fi

# build cra app
export REACT_APP_SENTRY_RELEASE=$GIT_SHA
export REACT_APP_CLIENT_LOG_LEVEL=ERROR
# Disable CRA built-in ESLint checks since we have our own config and a separate step for this
export DISABLE_ESLINT_PLUGIN=true
node --max-old-space-size=16000 scripts/build.js

echo "build finished"
