package com.external.plugins.exceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.exceptions.pluginExceptions.BasePluginError;
import com.appsmith.external.models.ErrorType;
import lombok.Getter;

import java.text.MessageFormat;

@Getter
public enum MySQLPluginError implements BasePluginError {
    QUERY_EXECUTION_FAILED(
            500,
            "PE-MYS-5000",
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    MYSQL_PLUGIN_ERROR(
            500,
            "PE-MYS-5001",
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    IS_KEYWORD_NOT_ALLOWED_IN_PREPARED_STATEMENT(
            500,
            "PE-MYS-4001",
            "{0}",
            AppsmithErrorAction.DEFAULT,
            "Query configuration is invalid",
            ErrorType.ACTION_CONFIGURATION_ERROR,
            "{1}",
            "{2}"
    ),
    INVALID_QUERY_SYNTAX(
            400,
            "PE-MYS-4002",
            "Query is syntactically wrong",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query syntax error",
            ErrorType.ACTION_CONFIGURATION_ERROR,
            "{0}",
            "{1}"
    ),
    MISSING_REQUIRED_PERMISSION(
            403,
            "PE-MYS-4003",
            "Required permission is missing with the DB user",
            AppsmithErrorAction.DEFAULT,
            "Required permission missing",
            ErrorType.AUTHENTICATION_ERROR,
            "{0}",
            "{1}"
    ),
    ;
    private final Integer httpErrorCode;
    private final String appErrorCode;
    private final String message;
    private final String title;
    private final AppsmithErrorAction errorAction;
    private final ErrorType errorType;

    private final String downstreamErrorMessage;

    private final String downstreamErrorCode;

    MySQLPluginError(Integer httpErrorCode, String appErrorCode, String message, AppsmithErrorAction errorAction,
                        String title, ErrorType errorType, String downstreamErrorMessage, String downstreamErrorCode) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        this.errorType = errorType;
        this.errorAction = errorAction;
        this.message = message;
        this.title = title;
        this.downstreamErrorMessage = downstreamErrorMessage;
        this.downstreamErrorCode = downstreamErrorCode;
    }

    public String getMessage(Object... args) {
        return new MessageFormat(this.message).format(args);
    }

    public String getErrorType() { return this.errorType.toString(); }

    public String getDownstreamErrorMessage(Object... args) {
        return replacePlaceholderWithValue(this.downstreamErrorMessage, args);
    }

    public String getDownstreamErrorCode(Object... args) {
        return replacePlaceholderWithValue(this.downstreamErrorCode, args);
    }
}
