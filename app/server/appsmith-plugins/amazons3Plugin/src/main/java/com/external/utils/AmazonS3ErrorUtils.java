package com.external.utils;

import com.amazonaws.AmazonClientException;
import com.amazonaws.AmazonServiceException;
import com.amazonaws.services.s3.model.AmazonS3Exception;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;

import java.io.Serializable;


public class AmazonS3ErrorUtils extends AppsmithPluginErrorUtils {

    private static AmazonS3ErrorUtils amazonS3ErrorUtils;


    private AmazonS3ErrorUtils () throws InstantiationException {
        /**
         * Prevention of creating any other new object by using constructor
         */
        if (amazonS3ErrorUtils != null) {
            throw new InstantiationException();
        }
    }

    /**
     * Prevention of creating any other new object by using clone
     */
    @Override
    protected Object clone() throws CloneNotSupportedException {
        return super.clone();
    }

    public static AmazonS3ErrorUtils getInstance() throws InstantiationException {
        if (amazonS3ErrorUtils == null) {
            synchronized (AmazonS3ErrorUtils.class) {
                if (amazonS3ErrorUtils == null){
                    amazonS3ErrorUtils = new AmazonS3ErrorUtils();
                }
            }
        }
        return amazonS3ErrorUtils;
    }

    /**
     * Extract small readable portion of error message from a larger less comprehensible error message.
     * @param error - any error object
     * @return readable error message
     */
    @Override
    public String getReadableError(Throwable error) {
        Throwable externalError;
        if (error instanceof AppsmithPluginException) {
            if (((AppsmithPluginException) error).getExternalError() == null) {
                return error.getMessage();
            }
            externalError = ((AppsmithPluginException) error).getExternalError();
        }
        else {
            externalError = error;
        }
        if (externalError instanceof AmazonS3Exception) {
            AmazonS3Exception amazonS3Exception = (AmazonS3Exception) externalError;
            /**
             * parsing the unreadable AmazonS3Exception error messages into readable
             *
             * Sample external error message:
             * null (Service : Amazon S3; Status Code : 404)
             *
             * Return string: null
             */
            return amazonS3Exception.getErrorMessage().split("\\(")[0].trim();
        }
        else if (externalError instanceof AmazonServiceException) {
            AmazonServiceException amazonServiceException = (AmazonServiceException) externalError;
            /**
             * parsing the unreadable AmazonServiceException error messages into readable
             *
             * Sample external error message:
             * The request signature we calculated does not match the signature you provided. Check your key and signing method.
             * (Service : Amazon S3; Status Code : 403)
             *
             * Return string: The request signature we calculated does not match the signature you provided. Check your key and signing method.
             */
            return amazonServiceException.getErrorMessage().split("\\(")[0].trim();
        }

        return error.getMessage().split("\\.")[0].trim() + ".";
    }
}

