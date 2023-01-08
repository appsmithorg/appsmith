package com.external.plugins.exceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.models.ErrorType;
import lombok.Getter;

import java.text.MessageFormat;

@Getter
public enum MySQLPluginError {
    QUERY_SYNTAX_ERROR(
            400,
            4001,
            "Query is syntactically wrong. Please check the documentation of MySQL.",
            "Query syntax error",
            AppsmithErrorAction.DEFAULT,
            null,
            ErrorType.INTERNAL_ERROR
    ),
    QUERY_EXECUTION_ERROR(
            500,
            5000,
            "MySQL query execution failed",
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

    MySQLPluginError(Integer httpErrorCode, Integer appErrorCode, String message, String title, AppsmithErrorAction errorAction, ErrorType errorType, Object...args) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        this.errorType = errorType;
        MessageFormat fmt = new MessageFormat(message);
        this.errorAction = errorAction;
        this.message = fmt.format(args);
        this.title = title;
    }

    public String getErrorType() { return this.errorType.toString(); }

}
