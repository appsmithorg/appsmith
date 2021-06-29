set -o errexit
set -o xtrace

# Replace `/` characters to `--` in the initiator.
# Sample CODEBUILD_INITIATOR: `codebuild-appsmith-ce-service-role/AWSCodeBuild-146ccba7-69a4-42b1-935b-e5ea50fc7535`
batch_id="${CODEBUILD_INITIATOR//\//--}"
aws s3 rm --recursive "$S3_BUILDS_PATH/$batch_id"
