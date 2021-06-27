# Build phase script for units node in the main build graph.

set -o errexit
set -o xtrace

java -version
node --version

cd "$CODEBUILD_SRC_DIR/app/client"
npm install -g yarn
yarn install --frozen-lockfile

# TODO: See if `--ci` is useful when running jest. <https://archive.jestjs.io/docs/en/24.x/cli>.
REACT_APP_ENVIRONMENT=PRODUCTION npx jest \
	-b --no-cache --coverage --collectCoverage=true --coverageDirectory='../../' --coverageReporters='json-summary' \
	> "$CODEBUILD_SRC_DIR/logs/client-tests.log" \
	& echo $! > client_pid

export APPSMITH_ENCRYPTION_SALT=ci-salt-is-white-like-radish
export APPSMITH_ENCRYPTION_PASSWORD=ci-password-is-red-like-carrot

export APPSMITH_CLOUD_SERVICES_BASE_URL=
export APPSMITH_IS_SELF_HOSTED=false

if ! mongo --eval 'db.runCommand({ connectionStatus: 1 })' "$APPSMITH_MONGODB_URI"; then
	cat "$CODEBUILD_SRC_DIR/logs/mongod.log"
fi

cd "$CODEBUILD_SRC_DIR/app/server"
# TODO: This runs `mvn package`, instead, run a command that's focused on tests instead.
./build.sh --batch-mode > "$CODEBUILD_SRC_DIR/logs/server-tests.log" \
	& echo $! > server_pid

sleep 2m
wait "$(cat client_pid)"
wait "$(cat server_pid)"

cat "$CODEBUILD_SRC_DIR/logs/client-tests.log"
cat "$CODEBUILD_SRC_DIR/logs/server-tests.log"
