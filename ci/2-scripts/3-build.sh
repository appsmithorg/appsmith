set -o errexit
set -o pipefail
set -o xtrace

curl-fail() {
	# Source: <https://superuser.com/a/1641410>.
	outfile="$(mktemp)"
	local code
	code="$(curl --insecure --silent --show-error --output "$outfile" --write-out "%{http_code}" "$@")"
	if [[ $code -lt 200 || $code -gt 302 ]] ; then
		cat "$outfile" >&2
		# Need below line because cURL doesn't print a final newline and that messes the logs in CloudWatch.
		echo
		cat "$CODEBUILD_SRC_DIR/logs/server.log"
		return 22
	fi
	cat "$outfile"
	rm "$outfile"
	# Need below line because cURL doesn't print a final newline and that messes the logs in CloudWatch.
	echo
}

{

echo "$BASH_VERSION"
java -version
node --version

aws s3 cp --no-progress "$S3_BUILDS_PREFIX/$BATCH_ID/client-dist.tgz" .
aws s3 cp --no-progress "$S3_BUILDS_PREFIX/$BATCH_ID/server-dist.tgz" .

tar -xaf client-dist.tgz
tar -xaf server-dist.tgz
du -sh client-dist server-dist

echo Building server code
cd "$CODEBUILD_SRC_DIR/server-dist"
export APPSMITH_MONGODB_URI="mongodb://localhost:27017/appsmith"
export APPSMITH_REDIS_URL="redis://localhost:6379"
APPSMITH_ENCRYPTION_SALT=ci-salt-is-white-like-radish \
	APPSMITH_ENCRYPTION_PASSWORD=ci-password-is-red-like-carrot \
	APPSMITH_CLOUD_SERVICES_BASE_URL='' \
	APPSMITH_IS_SELF_HOSTED=false \
	java -jar server-*.jar > "$CODEBUILD_SRC_DIR/logs/server.log" 2>&1 &

# Serve the react bundle on a specific port. Nginx will proxy to this port.
echo "127.0.0.1	dev.appsmith.com" | tee -a /etc/hosts
npx serve -s "$CODEBUILD_SRC_DIR/client-dist" -p 3000 > "$CODEBUILD_SRC_DIR/logs/client.log" 2>&1 &

export APPSMITH_DISABLE_TELEMETRY=true

echo Building client code
cd "$CODEBUILD_SRC_DIR/app/client"
npm install -g yarn
time yarn install --frozen-lockfile
if [[ ! -d ~/.cache/Cypress ]]; then
	npx cypress install
fi

# Substitute all the env variables in nginx
vars_to_substitute='\$'"$(env | grep -o "^APPSMITH_[A-Z0-9_]\+" | paste -s -d, - | sed 's/,/,\\$/g')"
echo "vars_to_substitute: $vars_to_substitute"
envsubst "$vars_to_substitute" < docker/templates/nginx-app.conf.template \
	| sed \
		-e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' \
		-e "s|__APPSMITH_CLIENT_PROXY_PASS__|http://localhost:3000|g" \
		-e "s|__APPSMITH_SERVER_PROXY_PASS__|http://localhost:8080|g" \
	| tee /etc/nginx/conf.d/app.conf
envsubst "$vars_to_substitute" < docker/templates/nginx-root.conf.template \
	| sed \
		-e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' \
		-e 's/user  *nginx;/user root;/' \
	| tee /etc/nginx/nginx.conf

# Create the SSL files for Nginx. Required for service workers to work properly.
# This is a self-signed certificate, and so when using cURL, we need to add the `-k` or `--insecure` argument.
mkdir -p /etc/certificate
openssl req -x509 -newkey rsa:4096 -nodes \
	-out /etc/certificate/dev.appsmith.com.pem \
	-keyout /etc/certificate/dev.appsmith.com-key.pem \
	-days 365 \
	-subj "/O=appsmith/CN=dev.appsmith.com"

if ! /etc/init.d/nginx reload; then
	cat /var/log/nginx/error.log
	exit 4
fi

echo "Sleeping to let the servers start"
# timeout 20s tail -500 -f "$CODEBUILD_SRC_DIR/logs/server.log" | grep -q 'Mongock has finished'
sleep 30s  # TODO: Wait more intelligently, by looking at the log files for a specific line.

if ! curl-fail https://dev.appsmith.com; then
	cat /var/log/nginx/access.log
	cat /var/log/nginx/error.log
	exit 5
fi

if ! mongo --eval 'db.runCommand({ connectionStatus: 1 })' "$APPSMITH_MONGODB_URI"; then
	cat "$CODEBUILD_SRC_DIR/logs/mongod.log"
	exit 6
fi

if ! curl-fail --verbose localhost:3000; then
	cat "$CODEBUILD_SRC_DIR/logs/client.log"
	exit 7
fi

if ! curl --insecure --verbose localhost:8080; then
	cat "$CODEBUILD_SRC_DIR/logs/server.log"
	exit 8
fi

# Create test users.
# Note: The USERNAME values must be valid email addresses, or the signup API calls will fail.
export CYPRESS_USERNAME=cy@example.com
export CYPRESS_PASSWORD=cypress-password
export CYPRESS_TESTUSERNAME1=cy1@example.com
export CYPRESS_TESTPASSWORD1=cypress-password1
export CYPRESS_TESTUSERNAME2=cy2@example.com
export CYPRESS_TESTPASSWORD2=cypress-password2
curl-fail -v -d "email=$CYPRESS_USERNAME" -d "password=$CYPRESS_PASSWORD" 'https://dev.appsmith.com/api/v1/users'
curl-fail -v -d "email=$CYPRESS_TESTUSERNAME1" -d "password=$CYPRESS_TESTPASSWORD1" 'https://dev.appsmith.com/api/v1/users'
curl-fail -v -d "email=$CYPRESS_TESTUSERNAME2" -d "password=$CYPRESS_TESTPASSWORD2" 'https://dev.appsmith.com/api/v1/users'

# Run the Cypress tests
if [[ -z $CYPRESS_RECORD_KEY || -z $CYPRESS_PROJECT_ID ]]; then
	echo 'Missing CYPRESS_RECORD_KEY or CYPRESS_PROJECT_ID.' >&2
	exit 2
fi

touch ../../.env  # Doing this to silence a misleading error message from `cypress/plugins/index.js`.
npx cypress info

# Git information for Cypress: <https://docs.cypress.io/guides/continuous-integration/introduction#Git-information>.
branch="$(git name-rev --name-only HEAD 2>/dev/null)"
if [[ -z $branch ]]; then
	echo "Unable to get branch" >&2
	git name-rev --name-only HEAD
else
	# When this variable is not set, Cypress will try to detect it itself, but it's not very reliable so we try our hand
	# at it first.
	export COMMIT_INFO_BRANCH="$branch"
fi

#	COMMIT_INFO_MESSAGE="$(git log -1 --pretty=%s)" \
#	COMMIT_INFO_EMAIL="$(git log -1 --pretty=%ae)" \
#	COMMIT_INFO_AUTHOR="$(git log -1 --pretty=%an)" \
#	COMMIT_INFO_SHA="$CODEBUILD_RESOLVED_SOURCE_VERSION" \
#	COMMIT_INFO_REMOTE="$CODEBUILD_SOURCE_REPO_URL" \

export NO_COLOR=1

if ! npx cypress run --headless --browser chrome \
		--record \
		--ci-build-id "$CODEBUILD_INITIATOR" \
		--parallel \
		--group 'Electrons on CodeBuild CI' \
		--env 'NODE_ENV=development' \
		--tag "$CODEBUILD_WEBHOOK_TRIGGER" \
		--spec 'cypress/integration/Smoke_TestSuite/**/*.js'; then
	echo "Cypress tests failed, printing backend server logs."
	cat "$CODEBUILD_SRC_DIR/logs/server.log"
	exit 3
fi

# At end of this script, CodeBuild does some cleanup and without the below line, it throws an error.
unset -f curl-fail

} 2>&1 | tee -a "ci/logs/$CODEBUILD_BATCH_BUILD_IDENTIFIER.log"
