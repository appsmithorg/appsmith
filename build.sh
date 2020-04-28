#!/bin/bash

# Remove previous dist directory

# Build the code. $@ accepts all the parameters from the input command line and uses it in the maven build command
mvn clean package "$@"

# Create the dist directory
mkdir -p dist/plugins

# Copy the server jar
cp ./appsmith-server/target/server-1.0-SNAPSHOT.jar dist/

# Copy all the plugins
cp ./appsmith-plugins/*/target/*.jar dist/plugins/
