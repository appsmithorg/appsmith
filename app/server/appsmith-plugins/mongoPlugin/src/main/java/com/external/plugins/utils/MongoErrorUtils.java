package com.external.plugins.utils;

import com.appsmith.external.exceptions.BaseException;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;
import com.mongodb.MongoException;

public class MongoErrorUtils extends AppsmithPluginErrorUtils {
    @Override
    public String getReadableError(Throwable error) {
        if (!(error instanceof MongoException) && !(error instanceof AppsmithPluginException)) {
            return error.getMessage();
        }

        switch (((BaseException)error).getAppErrorCode()) {
            default:
                return error.getMessage().split("\\.")[0] + ".";
        }
    }
}
