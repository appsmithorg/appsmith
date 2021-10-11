package com.appsmith.external.models;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;

public class GitCommandResult {

    String statusCode;
    String method;
    String errorType;
    Object body;
    Boolean isExecutionSuccess = false;

    public void setErrorInfo(Throwable error) {
        this.body = error.getMessage();
        this.statusCode = ((AppsmithPluginException) error).getAppErrorCode().toString();
        this.method = ((AppsmithPluginException) error).getTitle();
        this.errorType = ((AppsmithPluginException) error).getErrorType();
    }

}
