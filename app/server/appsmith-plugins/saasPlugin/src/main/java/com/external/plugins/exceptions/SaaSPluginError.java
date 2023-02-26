package com.external.plugins.exceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginErrorCode;
import com.appsmith.external.exceptions.pluginExceptions.BasePluginError;
import com.appsmith.external.models.ErrorType;
import lombok.Getter;


@Getter
public enum SaaSPluginError implements BasePluginError {
    API_EXECUTION_FAILED(
            500,
            "PE-SAS-5000",
            "{0}",
            AppsmithErrorAction.LOG_EXTERNALLY,
            "API execution error",
            ErrorType.INTERNAL_ERROR,
            "{1}",
            "{2}"
    ),
    UNSUPPORTED_PLUGIN_OPERATION(
            500,
            "PE-SAS-5001",
            "Testing datasource for SaaS plugin is not supported",
            AppsmithErrorAction.DEFAULT,
            "Unsupported operation",
            ErrorType.INTERNAL_ERROR,
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

    SaaSPluginError(Integer httpErrorCode, String appErrorCode, String message, AppsmithErrorAction errorAction,
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

    @Override
    public String getMessage(Object... args) {
        return replacePlaceholderWithValue(this.message, args);
    }

    @Override
    public String getDownstreamErrorMessage(Object... args) {
        return replacePlaceholderWithValue(this.downstreamErrorMessage, args);
    }

    @Override
    public String getDownstreamErrorCode(Object... args) {
        return replacePlaceholderWithValue(this.downstreamErrorCode, args);
    }

    @Override
    public String getErrorType() { return this.errorType.toString(); }
}
