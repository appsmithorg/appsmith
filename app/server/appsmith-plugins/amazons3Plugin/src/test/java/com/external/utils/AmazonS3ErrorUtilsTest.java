package com.external.utils;

import com.amazonaws.AmazonServiceException;
import com.amazonaws.services.s3.model.AmazonS3Exception;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.*;

public class AmazonS3ErrorUtilsTest {

    private String noSuchBucketErrorMessage;
    private String signatureDoesNotMatchErrorMessage;


    @Before
    public void setUp(){
        noSuchBucketErrorMessage = "null (Service : Amazon S3; Status Code : 404)";
        signatureDoesNotMatchErrorMessage = "The request signature we calculated does not match the signature you provided. Check your key and signing method. (Service : Amazon S3; Status Code : 403)";
    }

    @Test
    public void getReadableErrorWithAmazonServiceException() throws InstantiationException {
        AmazonServiceException amazonServiceException = new AmazonServiceException(noSuchBucketErrorMessage);
        String message = AmazonS3ErrorUtils.getInstance().getReadableError(amazonServiceException);
        assertFalse(message.isEmpty());
        assertNotNull(message);
    }

    @Test
    public void getReadableErrorWithAmazonS3Exception() throws InstantiationException {
        AmazonS3Exception amazonS3Exception = new AmazonS3Exception(signatureDoesNotMatchErrorMessage);
        String message = AmazonS3ErrorUtils.getInstance().getReadableError(amazonS3Exception);
        assertFalse(message.isEmpty());
        assertNotNull(message);
    }

}