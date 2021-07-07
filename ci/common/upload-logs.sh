set -o errexit
set -o xtrace

ls "$CODEBUILD_SRC_DIR/ci/logs"
aws s3 cp --no-progress --recursive "$CODEBUILD_SRC_DIR/ci/logs" "$S3_LOGS_PREFIX/$BATCH_ID/"

# Exit with status of 1 when build is succeeding, or 0 if failing.
exit $((CODEBUILD_BUILD_SUCCEEDING ^ 1))
