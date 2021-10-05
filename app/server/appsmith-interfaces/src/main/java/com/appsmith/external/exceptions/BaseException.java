package com.appsmith.external.exceptions;

public abstract class BaseException extends RuntimeException {

    public BaseException(String message) {
        super(message);
    }

    public abstract Integer getHttpStatus();

    public abstract Integer getAppErrorCode();

    public abstract AppsmithErrorAction getErrorAction();

    public abstract String getTitle();

    public String getMessage() {
        return super.getMessage();
    }

}
