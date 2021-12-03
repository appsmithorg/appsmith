set -o errexit
set -o xtrace

aws s3 rm --recursive "$S3_BUILDS_PREFIX/$BATCH_ID"
