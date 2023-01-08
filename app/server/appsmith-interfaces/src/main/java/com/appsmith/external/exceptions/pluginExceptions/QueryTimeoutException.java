package com.appsmith.external.exceptions.pluginExceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.models.ErrorType;

public class QueryTimeoutException extends BasePluginError{

    public QueryTimeoutException(Object...args) {
        super(
                AppsmithPluginError.PLUGIN_QUERY_TIMEOUT_ERROR.getHttpErrorCode(),
                AppsmithPluginError.PLUGIN_QUERY_TIMEOUT_ERROR.getAppErrorCode(),
                "{0} timed out in {1} milliseconds. " +
                        "Please increase timeout. This can be found in Settings tab of {0}.",
                "Timed out on query execution",
                AppsmithPluginError.PLUGIN_QUERY_TIMEOUT_ERROR.getErrorAction(),
                AppsmithPluginError.PLUGIN_QUERY_TIMEOUT_ERROR.getErrorType(),
                "{2}",
                "{3}",
                args
        );
    }
}
