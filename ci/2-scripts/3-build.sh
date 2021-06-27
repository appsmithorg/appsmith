#!/bin/bash

set -o errexit
set -o xtrace

curl-fail() {
	# Source: <https://superuser.com/a/1641410>.
	outfile="$(mktemp)"
	local code
	code="$(curl --insecure --silent --show-error --output "$outfile" --write-out "%{http_code}" "$@")"
	if [[ $code -lt 200 || $code -gt 302 ]] ; then
		cat "$outfile" >&2
		return 22
	fi
	cat "$outfile"
	rm "$outfile"
	# Need below line because cURL doesn't print a final newline and that messes the logs in CloudWatch.
	echo
}

java -version
node --version

echo Building client code
cd "$CODEBUILD_SRC_DIR/app/client"
npm install -g yarn
yarn install --frozen-lockfile
if [[ ! -d ~/.cache/Cypress ]]; then
	npx cypress install
fi

REACT_APP_SHOW_ONBOARDING_FORM=true yarn run build

echo Building server code
cd "$CODEBUILD_SRC_DIR/app/server"
./build.sh --batch-mode -DskipTests
cd dist
APPSMITH_ENCRYPTION_SALT=ci-salt-is-white-like-radish \
	APPSMITH_ENCRYPTION_PASSWORD=ci-password-is-red-like-carrot \
	APPSMITH_CLOUD_SERVICES_BASE_URL='' \
	APPSMITH_IS_SELF_HOSTED=false \
	java -jar server-*.jar > "$CODEBUILD_SRC_DIR/logs/server.log" &

# Serve the react bundle on a specific port. Nginx will proxy to this port
echo "127.0.0.1	dev.appsmith.com" | tee -a /etc/hosts
npx serve -s build -p 3000 &

cd "$CODEBUILD_SRC_DIR/app/client"

if ! mongo --eval 'db.runCommand({ connectionStatus: 1 })' "$APPSMITH_MONGODB_URI"; then
	cat "$CODEBUILD_SRC_DIR/logs/mongod.log"
	exit 6
fi

curl-fail --verbose localhost:3000

sleep 10s
if ! curl --insecure --verbose localhost:8080; then
	docker logs appsmith-server
	exit 7
fi

# Random user names go here
# Note: The USERNAME values must be valid email addresses, or the signup API calls will fail.
export CYPRESS_USERNAME=cy@example.com
export CYPRESS_PASSWORD=cypas
export CYPRESS_TESTUSERNAME1=cy1@example.com
export CYPRESS_TESTPASSWORD1=cypas1
export CYPRESS_TESTUSERNAME2=cy2@example.com
export CYPRESS_TESTPASSWORD2=cypas2
export APPSMITH_DISABLE_TELEMETRY=true
export APPSMITH_GOOGLE_MAPS_API_KEY=AIzaSyBOQFulljufGt3VDhBAwNjZN09KEFufVyg

# Substitute all the env variables in nginx
vars_to_substitute=$(printf '\$%s,' $(env | grep -o "^APPSMITH_[A-Z0-9_]\+" | xargs))
echo "vars_to_substitute: $vars_to_substitute"
cat docker/templates/nginx-app.conf.template \
	| sed -e "s|__APPSMITH_CLIENT_PROXY_PASS__|http://localhost:3000|g" \
	| sed -e "s|__APPSMITH_SERVER_PROXY_PASS__|http://localhost:8080|g" \
	| envsubst $vars_to_substitute \
	| sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' \
	| tee /etc/nginx/conf.d/app.conf
cat docker/templates/nginx-root.conf.template \
	| envsubst ${vars_to_substitute} \
	| sed -e 's|\${\(APPSMITH_[A-Z0-9_]*\)}||g' -e 's/user  *nginx;/user root;/' \
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

sleep 5s
if ! curl-fail https://dev.appsmith.com; then
	cat /var/log/nginx/access.log
	cat /var/log/nginx/error.log
	exit 5
fi

echo "Sleeping for 30 seconds to let the servers start"
sleep 30

# Create test users.
curl-fail -v -d "email=$CYPRESS_USERNAME" -d "password=$CYPRESS_PASSWORD" 'https://dev.appsmith.com/api/v1/users'
curl-fail -v -d "email=$CYPRESS_TESTUSERNAME1" -d "password=$CYPRESS_TESTPASSWORD1" 'https://dev.appsmith.com/api/v1/users'
curl-fail -v -d "email=$CYPRESS_TESTUSERNAME2" -d "password=$CYPRESS_TESTPASSWORD2" 'https://dev.appsmith.com/api/v1/users'

# Run the Cypress tests
if [[ -z $CYPRESS_RECORD_KEY || -z $CYPRESS_PROJECT_ID ]]; then
	echo 'Missing CYPRESS_RECORD_KEY or CYPRESS_PROJECT_ID.' >&2
	exit 2
fi

touch ../../.env  # Doing this to silence a misleading error message from `cypress/plugins/index.js`.
npx cypress version
npx cypress run --headless --browser chrome \
	--record \
	--ci-build-id "$CODEBUILD_SOURCE_VERSION" \
	--parallel \
	--group 'Electrons on CodeBuild CI' \
	--env 'NODE_ENV=development' \
	--tag "$CODEBUILD_WEBHOOK_TRIGGER" \
	--spec 'cypress/integration/Smoke_TestSuite/ClientSideTests/FormWidgets/Input_spec.js'
	# --spec 'cypress/integration/Smoke_TestSuite/**/*.js'

# At end of this script, CodeBuild does some cleanup and without the below line, it throws an error.
unset -f curl-fail
