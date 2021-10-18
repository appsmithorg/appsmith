package com.appsmith.external.exceptions.pluginExceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.exceptions.BaseException;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppsmithPluginException extends BaseException {
    private final Throwable externalError;
    private final AppsmithPluginError error;
    private final Object[] args;

    public AppsmithPluginException(AppsmithPluginError error, Object... args) {
        this(null, error, args);
    }

    public AppsmithPluginException(Throwable externalError, AppsmithPluginError error, Object... args) {
        super(error.getMessage(args));
        this.externalError = externalError;
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

    public AppsmithErrorAction getErrorAction() {
        return this.error.getErrorAction();
    }

    public String getTitle() { return this.error.getTitle(); }

    public String getErrorType() { return this.error.getErrorType(); }
}
