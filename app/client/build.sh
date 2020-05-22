#!/bin/sh
# GIT_BRANCH=$(git branch  --no-color  | grep -E '^\*' | sed 's/\*[^a-z]*//g')

GIT_SHA=$(eval git rev-parse HEAD)
echo $GIT_SHA
REACT_APP_SENTRY_RELEASE=$GIT_SHA craco --max-old-space-size=4096 build --config craco.build.config.js

rm ./build/static/js/*.js.map
echo "build finished"