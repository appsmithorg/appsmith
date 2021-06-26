#!/bin/bash

set -o errexit

ACCOUNT_ID="$(echo "$CODEBUILD_BUILD_ARN" | cut -d: -f5)"
TAG_NAME=${CODEBUILD_SOURCE_VERSION:-release}
echo "TAG_NAME: $TAG_NAME"

aws --version
java -version
node --version
docker version
docker info

aws ecr get-login-password --region "$AWS_REGION" \
	| docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Check the cache status.
du -sh ~/.m2 || true
