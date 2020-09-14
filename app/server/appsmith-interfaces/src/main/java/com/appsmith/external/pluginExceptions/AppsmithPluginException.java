package com.appsmith.external.pluginExceptions;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppsmithPluginException extends Exception {

    private final AppsmithPluginError error;
    private final Object[] args;

    public AppsmithPluginException(AppsmithPluginError error, Object... args) {
        super(error.getMessage(args));
        this.error = error;
        this.args = args;
    }

    public Integer getHttpStatus() {
        return this.error.getHttpErrorCode();
    }

    @Override
    public String getMessage() {
        return this.error.getMessage(args);
    }

    public Integer getAppErrorCode() {
        return this.error == null ? 0 : this.error.getAppErrorCode();
    }

}
