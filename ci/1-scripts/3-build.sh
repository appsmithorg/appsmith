# Build phase script for units node in the main build graph.

set -o errexit
set -o xtrace

cd "$CODEBUILD_SRC_DIR/app/client"
npm install -g yarn
yarn install --frozen-lockfile

# TODO: See if `--ci` is useful when running jest. <https://archive.jestjs.io/docs/en/24.x/cli>.
REACT_APP_ENVIRONMENT=PRODUCTION npx jest -b --no-cache --coverage --collectCoverage=true --coverageDirectory='../../' --coverageReporters='json-summary'

export APPSMITH_ENCRYPTION_SALT=ci-salt-is-white-like-radish
export APPSMITH_ENCRYPTION_PASSWORD=ci-password-is-red-like-carrot

export APPSMITH_CLOUD_SERVICES_BASE_URL=
export APPSMITH_IS_SELF_HOSTED=false

cd "$CODEBUILD_SRC_DIR/app/server"
./build.sh --batch-mode  # TODO: This runs `mvn package`, instead, run a command that's focused on tests instead.
