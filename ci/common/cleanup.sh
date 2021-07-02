set -o errexit
set -o xtrace

source "$CODEBUILD_SRC_DIR/ci/extra-env.sh"
aws s3 rm --recursive "$S3_BUCKET_PREFIX/builds/$BATCH_ID"
