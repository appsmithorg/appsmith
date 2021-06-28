# Build Docker images for client and server, and push to registry/registries.

set -o errexit
set -o xtrace

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

echo Building client code
cd "$CODEBUILD_SRC_DIR/app/client"
npm install -g yarn
yarn install --frozen-lockfile

REACT_APP_SHOW_ONBOARDING_FORM=true yarn run build

docker build --tag "${image_prefix}appsmith-editor:$DOCKER_TAG_NAME" .

echo Building server code
cd "$CODEBUILD_SRC_DIR/app/server"
./build.sh --batch-mode --threads 1.0C -Dmaven.test.skip=true

docker build --tag "${image_prefix}appsmith-server:$DOCKER_TAG_NAME" .

docker push "${image_prefix}appsmith-editor:$DOCKER_TAG_NAME"
docker push "${image_prefix}appsmith-server:$DOCKER_TAG_NAME"
