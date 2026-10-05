package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;
import software.amazon.awssdk.awscore.exception.AwsErrorDetails;
import software.amazon.awssdk.awscore.exception.AwsServiceException;
import software.amazon.awssdk.http.SdkHttpResponse;

import java.util.Optional;

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

        if (externalError instanceof AwsServiceException awsServiceException) {
            /**
             * parsing the unreadable AwsServiceException error messages into readable
             *
             * Sample external error message:
             * The specified access point name or account is not valid.
             * Sample external error code:
             * InvalidAccessPoint
             * Return string: InvalidAccessPoint: The specified access point name or account is not valid.
             *
             * A response without an S3 error document, such as an empty or HTML body, carries neither; the HTTP
             * status takes their place, e.g. "403 Forbidden: Forbidden".
             */
            AwsErrorDetails details = awsServiceException.awsErrorDetails();
            String errorCode = details == null ? null : details.errorCode();
            String errorMessage = details == null ? awsServiceException.getMessage() : details.errorMessage();
            if (errorCode == null && errorMessage == null) {
                Optional<String> statusText = Optional.ofNullable(details)
                        .map(AwsErrorDetails::sdkHttpResponse)
                        .flatMap(SdkHttpResponse::statusText);
                errorCode = statusText
                        .map(text -> awsServiceException.statusCode() + " " + text)
                        .orElse(String.valueOf(awsServiceException.statusCode()));
                errorMessage = statusText.orElse(awsServiceException.getMessage());
            }
            return errorCode + ": " + errorMessage;
        }

        /**
         * Base case when the error is not an instance of AwsServiceException or of its subclasses.
         * Sample external error message:
         * An unescaped quote was found while parsing the CSV file. To allow quoted record delimiters, set AllowQuotedRecordDelimiter to 'TRUE'.
         * Return String
         * An unescaped quote was found while parsing the CSV file. To allow quoted record delimiters, set AllowQuotedRecordDelimiter to 'TRUE'.
         **/
        return error.getMessage();
    }
}
