set -o errexit
set -o xtrace

aws s3 rm --recursive "$S3_BUCKET_PREFIX/builds/$BATCH_ID"
