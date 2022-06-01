#!/bin/bash

# Remove previous dist directory
rm -rf dist/

is_tests_enabled=true
for i in "$@"; do
  if [[ $i == "-DskipTests" ]]; then
    is_tests_enabled=false
    break
  fi
done

if $is_tests_enabled; then
  # If tests will be run, let's pull some required images that often fail to be pulled from inside Maven's test run.
  docker image pull testcontainers/ryuk:0.3.0
fi

# Build the code. $@ accepts all the parameters from the input command line and uses it in the maven build command
mvn clean package "$@"

if [[ $? -eq 0 ]]; then
  echo "mvn Successful"
else
  echo "mvn Failed"
  exit 1
fi

# Create the dist directory
mkdir -p dist/plugins

# Copy the server jar
cp -v ./appsmith-server/target/server-*.jar dist/

# Copy all the plugins
rsync -av --exclude "original-*.jar" ./appsmith-plugins/*/target/*.jar dist/plugins/
