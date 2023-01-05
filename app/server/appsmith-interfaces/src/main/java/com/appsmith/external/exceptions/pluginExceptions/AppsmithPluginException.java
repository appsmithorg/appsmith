package com.appsmith.external.exceptions.pluginExceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.exceptions.BaseException;
import com.appsmith.external.models.ErrorType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppsmithPluginException extends BaseException {
    private final Throwable externalError;

    private final AppsmithPluginErrorBaseType appsmithPluginErrorBaseType;
    private final Object[] args;

    public AppsmithPluginException(AppsmithPluginErrorBaseType error, Object... args) {
        this(null, error, args);
    }

    public AppsmithPluginException(Throwable externalError, AppsmithPluginErrorBaseType error, Object... args) {
        super(error.getMessage(args));
        this.externalError = externalError;
        this.appsmithPluginErrorBaseType = error;
        this.args = args;
    }

    public Integer getHttpStatus() {
        return this.appsmithPluginErrorBaseType.getHttpErrorCode();
    }

    @Override
    public String getMessage() {
        return this.appsmithPluginErrorBaseType.getMessage(args);
    }

    public Integer getAppErrorCode() {
        return this.appsmithPluginErrorBaseType == null ? 0 : this.appsmithPluginErrorBaseType.getAppErrorCode();
    }

    public AppsmithErrorAction getErrorAction() {
        return this.appsmithPluginErrorBaseType.getErrorAction();
    }

    public String getTitle() { return this.appsmithPluginErrorBaseType.getTitle(); }

    public ErrorType getErrorType() { return this.appsmithPluginErrorBaseType.getErrorType(); }
}
