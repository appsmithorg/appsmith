package com.appsmith.external.exceptions.pluginExceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.models.ErrorType;

public interface AppsmithPluginErrorBaseType {
     Integer getHttpErrorCode();
     Integer getAppErrorCode();
     String getMessage(Object... args);
     String getTitle();
     AppsmithErrorAction getErrorAction();
     ErrorType getErrorType();
}
