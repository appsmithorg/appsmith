package com.external.plugins.exceptions;

import com.appsmith.external.exceptions.pluginExceptions.BasePluginError;

public class MySQLQueryExecutionError extends BasePluginError {
    public MySQLQueryExecutionError(Object...args) {
        super(
                MySQLPluginError.QUERY_EXECUTION_ERROR.getHttpErrorCode(),
                MySQLPluginError.QUERY_EXECUTION_ERROR.getAppErrorCode(),
                MySQLPluginError.QUERY_EXECUTION_ERROR.getMessage(),
                MySQLPluginError.QUERY_EXECUTION_ERROR.getTitle(),
                MySQLPluginError.QUERY_EXECUTION_ERROR.getErrorAction(),
                MySQLPluginError.QUERY_EXECUTION_ERROR.getErrorType(),
                "{0}",
                "{1}"
        );
    }
}
