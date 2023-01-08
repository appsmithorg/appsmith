package com.appsmith.external.exceptions.pluginExceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.models.ErrorType;

public class GetStructureException extends BasePluginError{

    public GetStructureException(Object...args) {
        super(
                AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR.getHttpErrorCode(),
                AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR.getAppErrorCode(),
                "{0}",
                AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR.getTitle(),
                AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR.getErrorAction(),
                AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR.getErrorType(),
                "{1}",
                "{2}"
                , args
        );

    }

}
