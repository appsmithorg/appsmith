package com.external.plugins.exceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.exceptions.pluginExceptions.BasePluginError;
import com.appsmith.external.models.ErrorType;
import lombok.Getter;

@Getter
public enum SeaTablePluginError implements BasePluginError {
    QUERY_EXECUTION_FAILED(
            500,
            "PE-STB-5000",
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Query execution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"),
    ACCESS_TOKEN_ERROR(
            401,
            "PE-STB-4001",
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "Authentication error",
            ErrorType.AUTHENTICATION_ERROR,
            "{1}",
            "{2}"),
    INVALID_BODY_ERROR(
            400,
            "PE-STB-4000",
            "{0}",
            AppsmithErrorAction.DEFAULT,
            "Invalid request body",
            ErrorType.ARGUMENT_ERROR,
            "{1}",
            "{2}");

    private final Integer httpErrorCode;
    private final String appErrorCode;
    private final String message;
    private final AppsmithErrorAction errorAction;
    private final String title;
    private final ErrorType errorType;
    private final String downstreamErrorMessage;
    private final String downstreamErrorCode;

    SeaTablePluginError(
            Integer httpErrorCode,
            String appErrorCode,
            String message,
            AppsmithErrorAction errorAction,
            String title,
            ErrorType errorType,
            String downstreamErrorMessage,
            String downstreamErrorCode) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        this.message = message;
        this.errorAction = errorAction;
        this.title = title;
        this.errorType = errorType;
        this.downstreamErrorMessage = downstreamErrorMessage;
        this.downstreamErrorCode = downstreamErrorCode;
    }

    @Override
    public String getMessage(Object... args) {
        return replacePlaceholderWithValue(this.message, args);
    }

    @Override
    public String getErrorType() {
        return this.errorType.toString();
    }

    @Override
    public String getDownstreamErrorMessage(Object... args) {
        return replacePlaceholderWithValue(this.downstreamErrorMessage, args);
    }

    @Override
    public String getDownstreamErrorCode(Object... args) {
        return replacePlaceholderWithValue(this.downstreamErrorCode, args);
    }
}
