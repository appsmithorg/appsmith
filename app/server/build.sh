#!/bin/bash

set -o errexit

min_java_major_version=17

maven_version_output="$(mvn --version)"
echo "$maven_version_output"

if [[ "$maven_version_output" != *"Java version: $min_java_major_version."* ]]; then
  echo $'\n'"Maven is not using Java $min_java_major_version. Please install Java $min_java_major_version and set it as the default Java version." >&2
  exit 1
fi

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

if [[ -f .env ]]; then
  echo "Found a .env file, loading environment variables from that file."
  set -o allexport
  source .env
fi

if [[ -f tx/transform.py ]]; then
  python3 tx/transform.py
fi

node scripts/check-field-constants.mjs

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
