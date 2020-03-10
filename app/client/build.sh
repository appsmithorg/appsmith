
#!/bin/sh
GIT_SHA=$(eval git rev-parse HEAD)
GIT_BRANCH=$(git branch  --no-color  | grep -E '^\*' | sed 's/\*[^a-z]*//g')

# RELEASE="${GIT_BRANCH}_${GIT_SHA}"


# RELEASE=$(echo "$RELEASE" | sed -e 's/[\/\\\ .]/\-/g')
# echo $RELEASE

REACT_APP_SENTRY_RELEASE=$GIT_SHA craco --max-old-space-size=2048 build --config craco.build.config.js

rm ./build/static/js/*.js.map
echo "build finished"