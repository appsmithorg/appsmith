package com.appsmith.external.exceptions.pluginExceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.models.ErrorType;

public class MaxResultSizeExceededException extends BasePluginError{
    public MaxResultSizeExceededException(Object... args) {
        super(
                AppsmithPluginError.PLUGIN_MAX_RESULT_SIZE_EXCEEDED.getHttpErrorCode(),
                AppsmithPluginError.PLUGIN_MAX_RESULT_SIZE_EXCEEDED.getAppErrorCode(),
                "Response size exceeded the maximum supported"
                        + " size of {0} MB. Please use LIMIT to reduce the amount of data fetched.",
                AppsmithPluginError.PLUGIN_MAX_RESULT_SIZE_EXCEEDED.getTitle(),
                AppsmithPluginError.PLUGIN_MAX_RESULT_SIZE_EXCEEDED.getErrorAction(),
                AppsmithPluginError.PLUGIN_MAX_RESULT_SIZE_EXCEEDED.getErrorType(),
                "{1}",
                "{2}"

        );
    }
}
