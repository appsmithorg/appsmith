package com.external.plugins.utils;

import com.appsmith.external.exceptions.BaseException;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;
import com.mongodb.Mongo;
import com.mongodb.MongoException;
import org.springframework.util.StringUtils;

public class MongoErrorUtils extends AppsmithPluginErrorUtils {
    @Override
    public String getReadableError(Throwable error) {
        if (!(error instanceof AppsmithPluginException)
                || ((AppsmithPluginException) error).getExternalError() == null
                || !(((AppsmithPluginException) error).getExternalError() instanceof MongoException)) {
            return error.getMessage();
        }

        MongoException externalError = (MongoException) ((AppsmithPluginException) error).getExternalError();
        int externalErrorCode = externalError.getCode();
        switch (externalErrorCode) {
            case 9:
                return getLast(externalError.getMessage().split("\\.")) + ".";
            default:
                return externalError.getMessage().split("\\.")[0] + ".";
        }
    }

    private String getLast(String[] messageArray) {
        if (messageArray.length == 0) {
            return "";
        }

        return messageArray[messageArray.length - 1];
    }
}
