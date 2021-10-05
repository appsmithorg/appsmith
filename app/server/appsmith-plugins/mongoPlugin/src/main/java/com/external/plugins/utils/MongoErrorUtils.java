package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;
import com.mongodb.MongoCommandException;
import com.mongodb.MongoSecurityException;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
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

                    /**
                     * Sample external error message:
                     * Failed to parse: { find: "newAction", limit: [ 10 ], $db: "mobtools", ... }. 'limit' field must
                     * be numeric.
                     *
                     * Return string: 'limit' field must be numeric.
                     */
                    return getLast(mongoCommandError.getErrorMessage().split("\\.")).trim() + ".";
                default:

                    /**
                     * Sample external error message:
                     * Error getting filter : Expected 'filter' to be BSON (or equivalent), but got string instead.
                     * Doc = [{find newAction} {filter filterx} {limit 10} {$db mobtools} ...]
                     *
                     * Return string: Error getting filter : Expected 'filter' to be BSON (or equivalent), but got
                     * string instead.
                     */
                    return mongoCommandError.getErrorMessage().split("\\.")[0].trim() + ".";
            }
        }
        else if (externalError instanceof MongoSecurityException) {
            MongoSecurityException mongoSecurityError = (MongoSecurityException) externalError;
            int errorCode = mongoSecurityError.getCode();
            switch (errorCode) {
                default:
                    /**
                     * Sample external error message:
                     * Exception authenticating MongoCredential{mechanism=SCRAM-SHA-1, userName='username',
                     * source='admin', password=<hidden>, mechanismProperties=<hidden>}
                     *
                     * Return string: Exception authenticating MongoCredential.
                     */
                    return mongoSecurityError.getMessage().split("\\{")[0].trim() + ".";
            }
        }

        /**
         * Sample external error message:
         * Error getting filter : Expected 'filter' to be BSON (or equivalent), but got string instead.
         * Doc = [{find newAction} {filter filterx} {limit 10} {$db mobtools} ...]
         *
         * Return string: Error getting filter : Expected 'filter' to be BSON (or equivalent), but got
         * string instead.
         */
        return error.getMessage().split("\\.")[0].trim() + ".";
    }

    // Get last element from array.
    private String getLast(String[] messageArray) {
        if (messageArray.length == 0) {
            return "";
        }

        return messageArray[messageArray.length - 1];
    }
}
