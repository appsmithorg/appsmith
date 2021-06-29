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
