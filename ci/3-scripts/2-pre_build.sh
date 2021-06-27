set -o errexit
set -o xtrace

ACCOUNT_ID="$(echo "$CODEBUILD_BUILD_ARN" | cut -d: -f5)"
echo "ACCOUNT_ID: $ACCOUNT_ID"
echo "AWS_REGION: $AWS_REGION"
echo "CODEBUILD_SOURCE_VERSION: $CODEBUILD_SOURCE_VERSION"

TAG_NAME=${CODEBUILD_SOURCE_VERSION:-release}
echo "TAG_NAME: $TAG_NAME"

aws --version
java -version
node --version
docker version
docker info

aws ecr get-login-password --region "$AWS_REGION" \
	| docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
