package com.appsmith.server.exceptions.util;

import com.appsmith.external.constants.MDCConstants;
import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.exceptions.BaseException;
import io.sentry.Sentry;
import io.sentry.SentryLevel;
import io.sentry.protocol.User;
import lombok.extern.slf4j.Slf4j;

import java.io.PrintWriter;
import java.io.StringWriter;

@Slf4j
public class SentryLogger {
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

        Sentry.configureScope(scope -> {
            /**
             * Send stack trace as a string message. This is a work around till it is figured out why raw
             * stack trace is not visible on Sentry dashboard.
             * */
            scope.setExtra("Stack Trace", stringStackTrace);
            scope.setLevel(SentryLevel.ERROR);
            scope.setTag("source", "appsmith-internal-server");
        });

        if (error instanceof BaseException) {
            BaseException baseError = (BaseException) error;
            if (baseError.getErrorAction() == AppsmithErrorAction.LOG_EXTERNALLY) {
                Sentry.configureScope(scope -> {
                    baseError.getContextMap().forEach(scope::setTag);
                    scope.setExtra("downstreamErrorMessage", baseError.getDownstreamErrorMessage());
                    scope.setExtra("downstreamErrorCode", baseError.getDownstreamErrorCode());
                });
                final User user = new User();
                user.setEmail(baseError.getContextMap().getOrDefault(MDCConstants.USER_EMAIL, "unknownUser"));
                Sentry.setUser(user);
                Sentry.captureException(error);
            }
        } else {
            Sentry.captureException(error);
        }
    }
}
