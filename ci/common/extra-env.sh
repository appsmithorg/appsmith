# This script should be idempotent. Meaning, sourcing it multiple times shouldn't cause problems.

set -o errexit
set -o xtrace

# Replace `/` characters to `--` in the initiator.
# Sample CODEBUILD_INITIATOR: `codebuild-appsmith-ce-service-role/AWSCodeBuild-146ccba7-69a4-42b1-935b-e5ea50fc7535`
BATCH_ID="${CODEBUILD_INITIATOR//\//--}"
