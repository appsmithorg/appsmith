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

# Replace `/` characters to `--` in the initiator.
# Sample CODEBUILD_INITIATOR: `codebuild-appsmith-ce-service-role/AWSCodeBuild-146ccba7-69a4-42b1-935b-e5ea50fc7535`
batch_id="${CODEBUILD_INITIATOR//\//--}"
mv -v build client-dist
tar -caf client-dist.tgz client-dist
aws s3 cp --no-progress client-dist.tgz "s3://codebuild-cache-appsmith/appsmith-ce-dist/$batch_id/client-dist.tgz"
