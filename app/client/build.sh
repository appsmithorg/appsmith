#!/bin/sh

GIT_SHA="$(git rev-parse HEAD)"
echo "GIT_SHA: '$GIT_SHA'"
echo "Sentry Auth Token: '$SENTRY_AUTH_TOKEN'"

REACT_APP_SENTRY_RELEASE="$GIT_SHA" EXTEND_ESLINT=true \
  npx craco --max-old-space-size=4096 build --config craco.build.config.js
build_result=$?

rm ./build/static/js/*.js.map

echo 'Package size:'
du -sh ./build

echo "build finished"

exit $build_result
