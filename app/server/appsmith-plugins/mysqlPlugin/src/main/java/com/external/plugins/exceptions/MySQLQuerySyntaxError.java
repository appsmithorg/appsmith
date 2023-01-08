package com.external.plugins.exceptions;

import com.appsmith.external.exceptions.pluginExceptions.BasePluginError;

public class MySQLQuerySyntaxError extends BasePluginError {
    public MySQLQuerySyntaxError(Object... args) {
        super(
                MySQLPluginError.QUERY_SYNTAX_ERROR.getHttpErrorCode(),
                MySQLPluginError.QUERY_SYNTAX_ERROR.getAppErrorCode(),
                MySQLPluginError.QUERY_SYNTAX_ERROR.getMessage(),
                MySQLPluginError.QUERY_SYNTAX_ERROR.getTitle(),
                MySQLPluginError.QUERY_SYNTAX_ERROR.getErrorAction(),
                MySQLPluginError.QUERY_SYNTAX_ERROR.getErrorType(),
                "{0}",
                "{1}"
        );
    }
}
