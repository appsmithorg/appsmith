package com.appsmith.external.exceptions;

import lombok.Getter;
import org.slf4j.MDC;

import java.util.HashMap;
import java.util.Map;

@Getter
public abstract class BaseException extends RuntimeException {

    private Map<String, String> contextMap;

    private boolean hideStackTraceInLogs = false;

    public BaseException(String message) {
        super(message);
        contextMap = MDC.getCopyOfContextMap();
        if (contextMap == null) {
            contextMap = new HashMap<>();
        }
    }

    public abstract Integer getHttpStatus();

    public abstract String getAppErrorCode();

    public abstract AppsmithErrorAction getErrorAction();

    public abstract String getTitle();

    public String getMessage() {
        return super.getMessage();
    }

    public abstract String getDownstreamErrorMessage();

    public abstract String getDownstreamErrorCode();

    public abstract String getErrorType();

    @SuppressWarnings("unchecked")
    public <T extends BaseException> T hideStackTraceInLogs() {
        hideStackTraceInLogs = true;
        return (T) this;
    }

    public boolean shouldHideStackTraceInLogs() {
        return hideStackTraceInLogs;
    }
}
