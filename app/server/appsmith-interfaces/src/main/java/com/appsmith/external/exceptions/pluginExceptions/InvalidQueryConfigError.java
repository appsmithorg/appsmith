package com.appsmith.external.exceptions.pluginExceptions;

public class InvalidQueryConfigError extends BasePluginError{
    public InvalidQueryConfigError(Object...args) {
        super(
                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getHttpErrorCode(),
                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getAppErrorCode(),
                "{0}",
                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getTitle(),
                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getErrorAction(),
                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getErrorType(),
                "{1}",
                "{2}"
        );
    }
}
