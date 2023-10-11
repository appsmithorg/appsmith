package com.external.utils;

import com.amazonaws.AmazonServiceException;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;

public class AmazonS3ErrorUtils extends AppsmithPluginErrorUtils {

    private static AmazonS3ErrorUtils amazonS3ErrorUtils;

    private AmazonS3ErrorUtils() throws InstantiationException {
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
                if (amazonS3ErrorUtils == null) {
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
        } else {
            externalError = error;
        }

        if (externalError instanceof AmazonServiceException) {
            AmazonServiceException amazonServiceException = (AmazonServiceException) externalError;
            /**
             * parsing the unreadable AmazonServiceException error messages into readable
             *
             * Sample external error message:
             * The specified access point name or account is not valid.
             * Sample external error code:
             * InvalidAccessPoint
             * Return string: InvalidAccessPoint: The specified access point name or account is not valid.
             */
            return amazonServiceException.getErrorCode() + ": " + amazonServiceException.getErrorMessage();
        }

        /**
         * Base case when the error is not an instance of AmazonServiceException or of its subclasses.
         * Sample external error message:
         * An unescaped quote was found while parsing the CSV file. To allow quoted record delimiters, set AllowQuotedRecordDelimiter to 'TRUE'.
         * Return String
         * An unescaped quote was found while parsing the CSV file. To allow quoted record delimiters, set AllowQuotedRecordDelimiter to 'TRUE'.
         **/
        return error.getMessage();
    }
}
