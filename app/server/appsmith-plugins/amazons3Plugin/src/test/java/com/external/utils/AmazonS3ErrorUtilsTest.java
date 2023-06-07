/* Copyright 2019-2023 Appsmith */
package com.external.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.amazonaws.AmazonServiceException;
import com.amazonaws.services.s3.model.AmazonS3Exception;

import org.junit.jupiter.api.Test;

public class AmazonS3ErrorUtilsTest {

    @Test
    public void getReadableErrorWithAmazonServiceException() throws InstantiationException {
        String errorMessage = "The specified access point name or account is not valid.";
        String errorCode = "InvalidAccessPoint";
        AmazonServiceException amazonServiceException = new AmazonS3Exception(errorMessage);
        amazonServiceException.setErrorCode(errorCode);
        AmazonS3ErrorUtils errorUtil = AmazonS3ErrorUtils.getInstance();
        String returnedErrorMessage = errorUtil.getReadableError(amazonServiceException);
        assertNotNull(returnedErrorMessage);
        assertEquals(returnedErrorMessage, errorCode + ": " + errorMessage);
    }

    @Test
    public void getReadableErrorWithAmazonS3Exception() throws InstantiationException {
        String errorMessage = "Reduce your request rate.";
        String errorCode = "SlowDown";
        AmazonS3Exception amazonS3Exception = new AmazonS3Exception(errorMessage);
        amazonS3Exception.setErrorCode(errorCode);
        AmazonS3ErrorUtils errorUtil = AmazonS3ErrorUtils.getInstance();
        String returnedErrorMessage = errorUtil.getReadableError(amazonS3Exception);
        assertNotNull(returnedErrorMessage);
        assertEquals(returnedErrorMessage, errorCode + ": " + errorMessage);
    }
}
