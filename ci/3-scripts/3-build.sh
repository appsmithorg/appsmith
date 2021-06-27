# Build Docker images for client and server, and push to registry/registries.

set -o errexit
set -o xtrace

echo Building client code
cd "$CODEBUILD_SRC_DIR/app/client"
npm install -g yarn
yarn install --frozen-lockfile

REACT_APP_SHOW_ONBOARDING_FORM=true yarn run build

docker build -t "appsmith-editor:$TAG_NAME" .
docker tag "appsmith-editor:$TAG_NAME" "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/appsmith-editor:$TAG_NAME"

echo Building server code
cd "$CODEBUILD_SRC_DIR/app/server"
./build.sh --batch-mode --threads 1.0C -Dmaven.test.skip=true

docker build --tag "appsmith-server:$TAG_NAME" .
docker tag "appsmith-server:$TAG_NAME" "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/appsmith-server:$TAG_NAME"

docker push "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/appsmith-editor:$TAG_NAME"
docker push "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/appsmith-server:$TAG_NAME"
