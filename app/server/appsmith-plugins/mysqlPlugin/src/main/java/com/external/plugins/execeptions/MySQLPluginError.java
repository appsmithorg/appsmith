package com.external.plugins.execeptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginErrorBaseType;
import com.appsmith.external.models.ErrorType;

public enum MySQLPluginError implements AppsmithPluginErrorBaseType {
    MYSQL_QUERY_SYNTAX_ERROR(
            500,
            4000,
            "{0}",
            "MySQL query syntax error",
            AppsmithErrorAction.LOG_EXTERNALLY,
            ErrorType.INTERNAL_ERROR
    ),
    MYSQL_QUERY_EXECUTION_FAILED(
            500,
            5000,
            "{0}",
            "Query execution error",
            AppsmithErrorAction.LOG_EXTERNALLY,
            ErrorType.INTERNAL_ERROR
    ),
    ;

    private final Integer httpErrorCode;
    private final Integer appErrorCode;
    private final String message;
    private final String title;
    private final AppsmithErrorAction errorAction;
    private final ErrorType errorType;

    MySQLPluginError(Integer httpErrorCode, Integer appErrorCode, String message, String title, AppsmithErrorAction errorAction, ErrorType errorType) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        this.message = message;
        this.title = title;
        this.errorAction = errorAction;
        this.errorType = errorType;
    }

    @Override
    public Integer getHttpErrorCode() {
        return null;
    }

    @Override
    public Integer getAppErrorCode() {
        return null;
    }

    @Override
    public String getMessage(Object... args) {
        return null;
    }

    @Override
    public String getTitle() {
        return null;
    }

    @Override
    public AppsmithErrorAction getErrorAction() {
        return null;
    }

    @Override
    public ErrorType getErrorType() {
        return null;
    }
}
