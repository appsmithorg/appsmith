# Build phase script for units node in the main build graph.

set -o errexit
set -o xtrace

echo "$BASH_VERSION"
node --version

cd "$CODEBUILD_SRC_DIR/app/client"
npm install -g yarn
yarn install --frozen-lockfile

REACT_APP_ENVIRONMENT=PRODUCTION \
	npx jest -b --no-cache --coverage --collectCoverage=true --coverageDirectory='../../' --coverageReporters='json-summary'

REACT_APP_SHOW_ONBOARDING_FORM=true \
	yarn run build

source "$CODEBUILD_SRC_DIR/ci/extra-env.sh"
mv -v build client-dist
tar -caf client-dist.tgz client-dist
aws s3 cp --no-progress client-dist.tgz "$S3_BUCKET_PREFIX/builds/$BATCH_ID/client-dist.tgz"
