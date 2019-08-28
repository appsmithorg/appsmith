package com.appsmith.server.exceptions;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppsmithException extends Exception {

    private AppsmithError error;
    private Object[] args;

    public AppsmithException(String msg) {
        super(msg);
    }

    public AppsmithException(AppsmithError error, Object... args) {
        super(error.getMessage(args));
        this.error = error;
        this.args = args;
    }

    public Integer getHttpStatus() {
        return this.error.getHttpErrorCode();
    }

    public String getMessage(Object... args) {
        return this.error.getMessage(this.args);
    }

    public Integer getAppErrorCode() {
        return this.error.getAppErrorCode();
    }

}
