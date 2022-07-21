package com.appsmith.server.exceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.exceptions.BaseException;
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

    public Integer getAppErrorCode() {
        return this.error == null ? -1 : this.error.getAppErrorCode();
    }

    public AppsmithErrorAction getErrorAction() {
        return this.error.getErrorAction();
    }

    public String getTitle() {
        return this.error.getTitle();
    }

    public String getErrorType() { return this.error.getErrorType(); }

    public String getReferenceDoc() { return this.error.getReferenceDoc(); }

}
