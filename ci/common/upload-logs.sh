if [[ $CODEBUILD_BUILD_SUCCEEDING == 0 || $UPLOAD_LOGS_ON_SUCCESS == 1 ]]; then
	aws s3 cp --no-progress --recursive "$CODEBUILD_SRC_DIR/ci/logs" "$S3_BUCKET_PREFIX/logs/$BATCH_ID"
fi
