package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;
import com.mongodb.MongoCommandException;
import com.mongodb.MongoSecurityException;

public class MongoErrorUtils extends AppsmithPluginErrorUtils {
    private static MongoErrorUtils mongoErrorUtils;

    public static MongoErrorUtils getInstance() {
        if (mongoErrorUtils == null) {
            mongoErrorUtils = new MongoErrorUtils();
        }

        return mongoErrorUtils;
    }

    /**
     * Extract small readable portion of error message from a larger less comprehensible error message.
     * @param error - any error object
     * @return readable error message
     */
    @Override
    public String getReadableError(Throwable error) {
        Throwable externalError;

        // If the external error is wrapped inside Appsmith error, then extract the external error first.
        if (error instanceof AppsmithPluginException) {
            if (((AppsmithPluginException) error).getExternalError() == null) {
                return error.getMessage();
            }

            externalError = ((AppsmithPluginException) error).getExternalError();
        }
        else {
            externalError = error;
        }

        if (externalError instanceof MongoCommandException) {
            MongoCommandException mongoCommandError = (MongoCommandException) externalError;
            int errorCode = mongoCommandError.getCode();

            // Error codes ref: https://github.com/mongodb/mongo/blob/50dc6dbe394c42d03659aa3410954f1e3ff46740/src/mongo/base/error_codes.err#L12
            switch (errorCode) {
                case 9: // FailedToParse error
                    return getLast(mongoCommandError.getErrorMessage().split("\\.")).trim() + ".";
                default:
                    return mongoCommandError.getErrorMessage().split("\\.")[0].trim() + ".";
            }
        }
        else if (externalError instanceof MongoSecurityException) {
            MongoSecurityException mongoSecurityError = (MongoSecurityException) externalError;
            int errorCode = mongoSecurityError.getCode();
            switch (errorCode) {
                default:
                    return mongoSecurityError.getMessage().split("\\{")[0] + ".";
            }
        }

        return error.getMessage().split("\\.")[0] + ".";
    }

    // Get last element from array.
    private String getLast(String[] messageArray) {
        if (messageArray.length == 0) {
            return "";
        }

        return messageArray[messageArray.length - 1];
    }
}
