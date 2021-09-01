set -o errexit
set -o xtrace

ls "$CODEBUILD_SRC_DIR/ci/logs"
aws s3 cp --no-progress --recursive "$CODEBUILD_SRC_DIR/ci/logs" "$S3_LOGS_PREFIX/$BATCH_ID/"
