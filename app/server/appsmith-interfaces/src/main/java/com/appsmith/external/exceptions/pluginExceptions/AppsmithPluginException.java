package com.appsmith.external.exceptions.pluginExceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.exceptions.BaseException;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppsmithPluginException extends BaseException {
    private final Throwable externalError;
    private final BasePluginError error;
    private final Object[] args;

    public AppsmithPluginException(BasePluginError error, Object... args) {
        this(null, error, args);
    }

    public AppsmithPluginException(Throwable externalError, BasePluginError error, Object... args) {
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

    public AppsmithErrorAction getErrorAction() {
        return this.error.getErrorAction();
    }

    public String getTitle() { return this.error.getTitle(); }

    @Override
    public String getErrorType() { return this.error.getErrorType(); }

    @Override
    public String getDownstreamErrorMessage() {
        return this.error.getDownstreamErrorMessage(args);
    }

    @Override
    public String getDownstreamErrorCode() {
        return this.error.getDownstreamErrorCode(args);
    }

    public String getAppErrorCode() {
        return this.error == null ? AppsmithPluginErrorCode.GENERIC_PLUGIN_ERROR.getCode() : this.error.getAppErrorCode();
    }
}
