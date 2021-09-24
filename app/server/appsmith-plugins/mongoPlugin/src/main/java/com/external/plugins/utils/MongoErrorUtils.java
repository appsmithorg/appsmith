package com.external.plugins.utils;

import com.appsmith.external.exceptions.BaseException;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;
import com.mongodb.Mongo;
import com.mongodb.MongoCommandException;
import com.mongodb.MongoException;
import com.mongodb.MongoSecurityException;
import org.springframework.util.StringUtils;

public class MongoErrorUtils extends AppsmithPluginErrorUtils {
    private static MongoErrorUtils mongoErrorUtils;

    public static MongoErrorUtils getInstance() {
        if (mongoErrorUtils == null) {
            mongoErrorUtils = new MongoErrorUtils();
        }

        return mongoErrorUtils;
    }

    @Override
    public String getReadableError(Throwable error) {
        if (!(error instanceof AppsmithPluginException)
                || ((AppsmithPluginException) error).getExternalError() == null
                || !(((AppsmithPluginException) error).getExternalError() instanceof MongoException)) {
            return error.getMessage();
        }

        if (error instanceof MongoCommandException) {
            MongoCommandException externalError =
                    (MongoCommandException) ((AppsmithPluginException) error).getExternalError();
            int externalErrorCode = externalError.getCode();
            switch (externalErrorCode) {
                case 9:
                    return getLast(externalError.getErrorMessage().split("\\.")) + ".";
                default:
                    return externalError.getErrorMessage().split("\\.")[0] + ".";
            }
        }
        else if (error instanceof MongoSecurityException) {
            MongoSecurityException externalError =
                    (MongoSecurityException) ((AppsmithPluginException) error).getExternalError();
            int externalErrorCode = externalError.getCode();
            switch (externalErrorCode) {
                default:
                    return externalError.getMessage().split("\\{")[0] + ".";
            }
        }

        return error.getMessage().split("\\.")[0] + ".";
    }

    private String getLast(String[] messageArray) {
        if (messageArray.length == 0) {
            return "";
        }

        return messageArray[messageArray.length - 1];
    }
}
