# Build phase script for units node in the main build graph.

set -o errexit
set -o xtrace

echo "$BASH_VERSION"
java -version

export APPSMITH_ENCRYPTION_SALT=ci-salt-is-white-like-radish
export APPSMITH_ENCRYPTION_PASSWORD=ci-password-is-red-like-carrot

export APPSMITH_CLOUD_SERVICES_BASE_URL=
export APPSMITH_IS_SELF_HOSTED=false

if ! mongo --eval 'db.runCommand({ connectionStatus: 1 })' "$APPSMITH_MONGODB_URI"; then
	cat "$CODEBUILD_SRC_DIR/logs/mongod.log"
fi

cd "$CODEBUILD_SRC_DIR/app/server"

# Not using `build.sh` here since it doesn't exit with a non-zero status when the build fails.
mvn package --batch-mode

mkdir -p dist/plugins

mv -v appsmith-server/target/server-1.0-SNAPSHOT.jar dist/
rsync -av --exclude "original-*.jar" appsmith-plugins/*/target/*.jar dist/plugins/

mv -v dist server-dist
tar -caf server-dist.tgz server-dist
aws s3 cp --no-progress server-dist.tgz "$S3_BUCKET_PREFIX/builds/$BATCH_ID/server-dist.tgz"
