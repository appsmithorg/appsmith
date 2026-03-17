package com.external.plugins.exceptions;

import com.appsmith.external.exceptions.pluginExceptions.BasePluginError;
import com.appsmith.external.models.ErrorType;
import lombok.Getter;

import java.text.MessageFormat;

@Getter
public enum SeaTablePluginError implements BasePluginError {
    QUERY_EXECUTION_FAILED(
            500,
            "PE-STB-5000",
            "{0}",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"),
    ACCESS_TOKEN_ERROR(
            401,
            "PE-STB-4001",
            "{0}",
            ErrorType.AUTHENTICATION_ERROR,
            "{1}",
            "{2}"),
    INVALID_BODY_ERROR(
            400,
            "PE-STB-4000",
            "{0}",
            ErrorType.ARGUMENT_ERROR,
            "{1}",
            "{2}");

    private final Integer httpErrorCode;
    private final String appErrorCode;
    private final String message;
    private final String title;
    private final ErrorType errorType;
    private final String downstreamErrorMessage;
    private final String downstreamErrorCode;

    SeaTablePluginError(
            Integer httpErrorCode,
            String appErrorCode,
            String message,
            ErrorType errorType,
            String downstreamErrorMessage,
            String downstreamErrorCode) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        this.message = message;
        this.title = "SeaTable plugin error";
        this.errorType = errorType;
        this.downstreamErrorMessage = downstreamErrorMessage;
        this.downstreamErrorCode = downstreamErrorCode;
    }

    @Override
    public String getMessage(Object... args) {
        return new MessageFormat(this.message).format(args);
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
