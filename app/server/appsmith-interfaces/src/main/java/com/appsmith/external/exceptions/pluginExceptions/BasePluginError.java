package com.appsmith.external.exceptions.pluginExceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;

import java.text.MessageFormat;

public abstract class BasePluginError {
    private  Integer httpErrorCode;
    private  Integer appErrorCode;
    private  String message;
    private  String title;
    private  AppsmithErrorAction errorAction;
    private  String errorType;

    private String downstreamErrorMessage;

    private String downstreamErrorCode;

    private final Object[] args;

    public BasePluginError(Integer httpErrorCode, Integer appErrorCode, String message, String title, AppsmithErrorAction errorAction, String errorType, String downstreamErrorMessage, String downstreamErrorCode, Object...args) {
        this.httpErrorCode = httpErrorCode;
        this.appErrorCode = appErrorCode;
        this.message = message;
        this.title = title;
        this.errorAction = errorAction;
        this.errorType = errorType;
        this.downstreamErrorMessage = downstreamErrorMessage;
        this.downstreamErrorCode = downstreamErrorCode;
        this.args = args;
    }

    public String getMessage() {
        return new MessageFormat(this.message).format(args);
    }

    public String getErrorType() { return this.errorType; }

    public Integer getHttpErrorCode() {
        return httpErrorCode;
    }

    public Integer getAppErrorCode() {
        return appErrorCode;
    }

    public String getTitle() {
        return title;
    }

    public AppsmithErrorAction getErrorAction() {
        return errorAction;
    }

    public String getDownstreamErrorMessage() {
        return new MessageFormat(this.downstreamErrorMessage).format(args);
    }

    public String getDownstreamErrorCode(Object...args) {
        return new MessageFormat(this.downstreamErrorCode).format(args);
    }
}
