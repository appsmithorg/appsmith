package com.appsmith.server.exceptions;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppsmithException extends Exception {

    private final AppsmithError error;
    private final transient Object[] args;

    public AppsmithException(AppsmithError error, Object... args) {
        super(error.getMessage(args));
        this.error = error;
        this.args = args;
    }

    public Integer getHttpStatus() {
        return this.error == null ? 500 : this.error.getHttpErrorCode();
    }

    @Override
    public String getMessage() {
        return this.error == null ? super.getMessage() : this.error.getMessage(this.args);
    }

    public Integer getAppErrorCode() {
        return this.error == null ? -1 : this.error.getAppErrorCode();
    }

}
