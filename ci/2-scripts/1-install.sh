#!/bin/bash

set -o errexit
set -o xtrace

UBUNTU_RELEASE="$(lsb_release -dc | awk '$1 == "Codename:" { print $2 }')"
echo "UBUNTU_RELEASE: $UBUNTU_RELEASE"
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" \
	| tee /etc/apt/sources.list.d/mongodb-org-4.4.list

add-apt-repository ppa:redislabs/redis

apt-get update -y

# Installing `gettext-base` just for `envsubst` command.
apt-get install -y maven gettext-base wget curl mongodb-org-{server,shell} redis nginx postgresql

service --status-all || true
which mongod || true
service reload nginx || true
systemctl restart nginx
psql --username=postgres --single-transaction --variable=ON_ERROR_STOP=ON --file="$CODEBUILD_SRC_DIR/app/client/cypress/init-pg-dump-for-test.sql"
psql --username=postgres --command="alter user postgres with password 'postgres'"

export APPSMITH_MONGODB_URI="mongodb://localhost:27017/appsmith"
export APPSMITH_REDIS_URL="redis://localhost:6379"
