package com.external.utils;

import org.junit.jupiter.api.Test;
import software.amazon.awssdk.awscore.exception.AwsErrorDetails;
import software.amazon.awssdk.awscore.exception.AwsServiceException;
import software.amazon.awssdk.services.s3.model.S3Exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class AmazonS3ErrorUtilsTest {

    @Test
    public void getReadableErrorWithAmazonServiceException() throws InstantiationException {
        String errorMessage = "The specified access point name or account is not valid.";
        String errorCode = "InvalidAccessPoint";
        AwsServiceException amazonServiceException = AwsServiceException.builder()
                .message(errorMessage)
                .awsErrorDetails(AwsErrorDetails.builder()
                        .errorCode(errorCode)
                        .errorMessage(errorMessage)
                        .build())
                .build();
        AmazonS3ErrorUtils errorUtil = AmazonS3ErrorUtils.getInstance();
        String returnedErrorMessage = errorUtil.getReadableError(amazonServiceException);
        assertNotNull(returnedErrorMessage);
        assertEquals(returnedErrorMessage, errorCode + ": " + errorMessage);
    }

    @Test
    public void getReadableErrorWithAmazonS3Exception() throws InstantiationException {
        String errorMessage = "Reduce your request rate.";
        String errorCode = "SlowDown";
        AwsServiceException amazonS3Exception = S3Exception.builder()
                .message(errorMessage)
                .awsErrorDetails(AwsErrorDetails.builder()
                        .errorCode(errorCode)
                        .errorMessage(errorMessage)
                        .build())
                .build();
        AmazonS3ErrorUtils errorUtil = AmazonS3ErrorUtils.getInstance();
        String returnedErrorMessage = errorUtil.getReadableError(amazonS3Exception);
        assertNotNull(returnedErrorMessage);
        assertEquals(returnedErrorMessage, errorCode + ": " + errorMessage);
    }
}
