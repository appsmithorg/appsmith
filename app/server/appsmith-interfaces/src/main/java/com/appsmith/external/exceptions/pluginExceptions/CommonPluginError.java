package com.appsmith.external.exceptions.pluginExceptions;


public class CommonPluginError extends BasePluginError {

    public CommonPluginError(Object...args) {
        super(
                AppsmithPluginError.PLUGIN_ERROR.getHttpErrorCode(),
                AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode(),
                "{0}",
                AppsmithPluginError.PLUGIN_ERROR.getTitle(),
                AppsmithPluginError.PLUGIN_ERROR.getErrorAction(),
                AppsmithPluginError.PLUGIN_ERROR.getErrorType(),
                "{1}",
                "{2}",
                args
        );
    }


}
