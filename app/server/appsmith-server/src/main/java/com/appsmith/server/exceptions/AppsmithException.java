package com.appsmith.server.exceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.exceptions.BaseException;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginErrorCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppsmithException extends BaseException {

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

    @Override
    public String getDownstreamErrorMessage() {
        //Downstream error message is not available for AppsmithError
        return null;
    }

    @Override
    public String getDownstreamErrorCode() {
        //Downstream error code is not available for AppsmithError
        return null;
    }

    public String getAppErrorCode() {
        return this.error == null ? AppsmithPluginErrorCode.GENERIC_PLUGIN_ERROR.getCode() : this.error.getAppErrorCode();
    }

    public AppsmithErrorAction getErrorAction() {
        return this.error.getErrorAction();
    }

    @Override
    public String getTitle() {
        return this.error.getTitle();
    }

    @Override
    public String getErrorType() { return this.error.getErrorType(); }

    public String getReferenceDoc() { return this.error.getReferenceDoc(); }

}
