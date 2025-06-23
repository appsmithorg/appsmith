package com.appsmith.server.exceptions.util;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.exceptions.BaseException;
import lombok.extern.slf4j.Slf4j;

import java.io.PrintWriter;
import java.io.StringWriter;

@Slf4j
public class ObservabilityLogger {
    public static void doLog(Throwable error) {
        if (error instanceof BaseException baseException && baseException.isHideStackTraceInLogs()) {
            log.error(baseException.getClass().getSimpleName() + ": " + baseException.getMessage());
        } else {
            log.error("", error);
        }

        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        error.printStackTrace(printWriter);
        String stringStackTrace = stringWriter.toString();

        // Log stack trace for debugging
        log.error("Stack Trace: {}", stringStackTrace);

        if (error instanceof BaseException) {
            BaseException baseError = (BaseException) error;
            if (baseError.getErrorAction() == AppsmithErrorAction.LOG_EXTERNALLY) {
                // Log additional context for external logging
                log.error(
                        "Downstream Error - Message: {}, Code: {}",
                        baseError.getDownstreamErrorMessage(),
                        baseError.getDownstreamErrorCode());
                baseError.getContextMap().forEach((key, value) -> log.error("Context - {}: {}", key, value));
            }
        }
    }
}
