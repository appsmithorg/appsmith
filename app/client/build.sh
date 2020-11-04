#!/bin/sh

GIT_SHA=$(eval git rev-parse HEAD)
echo $GIT_SHA
REACT_APP_SENTRY_RELEASE=$GIT_SHA EXTEND_ESLINT=true node --max-old-space-size=4096 ./scripts/build.js

rm ./build/static/js/*.js.map
echo "build finished"
