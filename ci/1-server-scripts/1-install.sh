set -o errexit
set -o pipefail
set -o xtrace

{

wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" \
	| tee /etc/apt/sources.list.d/mongodb-org-4.4.list

add-apt-repository --yes ppa:redislabs/redis

apt-get update --yes

time apt-get install --yes maven mongodb-org-{server,shell} redis

mkdir -p "$CODEBUILD_SRC_DIR/logs"

# Start a MongoDB server.
mkdir -p /data/db
nohup mongod > "$CODEBUILD_SRC_DIR/logs/mongod.log" 2>&1 & disown $!

# Start a Redis server.
nohup redis-server > "$CODEBUILD_SRC_DIR/logs/redis.log" 2>&1 & disown $!

} 2>&1 | tee -a "ci/logs/$CODEBUILD_BATCH_BUILD_IDENTIFIER.log"
