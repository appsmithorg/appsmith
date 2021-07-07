# Build Docker images for client and server, and push to registry/registries.

set -o errexit
set -o pipefail
set -o xtrace

{

aws --version
java -version
node --version
docker version

echo "$DOCKER_HUB_PASSWORD" | docker login --username "$DOCKER_HUB_USERNAME" --password-stdin
docker info

image_prefix=""
if [[ -z $DOCKER_HUB_ORGANIZATION ]]; then
	image_prefix="$DOCKER_HUB_ORGANIZATION/"
fi

if [[ -z $DOCKER_TAG_NAME ]]; then
	DOCKER_TAG_NAME="${CODEBUILD_SOURCE_VERSION:-release}"
fi

aws s3 cp --no-progress "$S3_BUILDS_PREFIX/$BATCH_ID/client-dist.tgz" .
aws s3 cp --no-progress "$S3_BUILDS_PREFIX/$BATCH_ID/server-dist.tgz" .

tar -xaf client-dist.tgz
mv -v client-dist "$CODEBUILD_SRC_DIR/app/client/build"
cd "$CODEBUILD_SRC_DIR/app/client"
docker build --tag "${image_prefix}appsmith-editor:$DOCKER_TAG_NAME" .

echo Building server code
tar -xaf server-dist.tgz
# The following is a horrible attempt at moving the jar files to their original locations, before `build.sh` moving
# them. The Dockerfile expects them to be _kind of_ in these places.
mkdir -p "$CODEBUILD_SRC_DIR/app/server/appsmith-server/target"
mv -v server-dist/server-1.0-SNAPSHOT.jar "$CODEBUILD_SRC_DIR/app/server/appsmith-server/target/"
mkdir -p "$CODEBUILD_SRC_DIR/app/server/appsmith-plugins/dummy"
mv -v server-dist/plugins "$CODEBUILD_SRC_DIR/app/server/appsmith-plugins/dummy/target"
ls "$CODEBUILD_SRC_DIR/app/server/appsmith-server/target"  # Should list `server-1.0-SNAPSHOT.jar` only.
ls"$CODEBUILD_SRC_DIR/app/server/appsmith-plugins/dummy/target"  # Should list all plugin jar files.
docker build --tag "${image_prefix}appsmith-server:$DOCKER_TAG_NAME" .

docker push "${image_prefix}appsmith-editor:$DOCKER_TAG_NAME"
docker push "${image_prefix}appsmith-server:$DOCKER_TAG_NAME"

} 2>&1 | tee -a "ci/logs/$CODEBUILD_BATCH_BUILD_IDENTIFIER.log"
