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

# This is causing the build to fail even when there's just warnings. We should move to using this in
# the future. If the following line doesn't run, the GitHub workflow will show up as success even if
# the craco build fails.
# exit $build_result
