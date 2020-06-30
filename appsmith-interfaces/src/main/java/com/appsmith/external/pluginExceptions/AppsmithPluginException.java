package com.appsmith.external.pluginExceptions;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppsmithPluginException extends Exception {

    private AppsmithPluginError error;
    private Object[] args;

    public AppsmithPluginException(String msg) {
        super(msg);
    }

    public AppsmithPluginException(AppsmithPluginError error, Object... args) {
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
