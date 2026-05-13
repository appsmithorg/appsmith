package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;
import com.arangodb.ArangoDBException;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.util.CollectionUtils;

import java.net.UnknownHostException;
import java.util.Arrays;

import static com.external.plugins.exceptions.ArangoDBErrorMessages.DS_HOSTNAME_MISSING_OR_INVALID_ERROR_MSG;

/**
 * This class is meant to provide helpful methods to re-format the error messages received from remote ArangoDB
 * datasource. Example:
 * Original error message: ArangoDBException: UnknownHostException: Something went wrong.
 * Re-formatted error message: Could not find host address. Please edit the 'Host Address' and/or the 'Port' field to
 * provide the desired endpoint.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class ArangoDBErrorUtils extends AppsmithPluginErrorUtils {
    private static ArangoDBErrorUtils arangodbErrorUtils;

    public static ArangoDBErrorUtils getInstance() {
        if (arangodbErrorUtils == null) {
            arangodbErrorUtils = new ArangoDBErrorUtils();
        }

        return arangodbErrorUtils;
    }

    @Override
    public String getReadableError(Throwable error) {
        Throwable externalError;

        // If the external error is wrapped inside Appsmith error, then extract the external error first.
        if (error instanceof AppsmithPluginException) {
            if (((AppsmithPluginException) error).getExternalError() == null) {
                return error.getMessage();
            }

            externalError = ((AppsmithPluginException) error).getExternalError();
        } else {
            externalError = error;
        }

        if (externalError instanceof ArangoDBException) {
            /**
             * Re-formatted error message: Could not find host address. Please edit the 'Host Address' and/or the
             * 'Port' field to provide the desired endpoint.
             *
             * We want this friendly message only for true DNS / name-resolution failures, not for every connection
             * problem. This is subtle on driver 7.x:
             *  - Driver 6 surfaced "java.net.UnknownHostException: ..." inline in the top-level message string.
             *  - Driver 7 (Vert.x WebClient) wraps *all* connectivity failures - DNS, SSL handshake, connection
             *    refused, timeouts - under a generic "Cannot contact any host!" {@link ArangoDBException}, with
             *    the real cause carried inside an aggregated {@code ArangoDBMultipleException} (whose nested
             *    exceptions are NOT exposed via the standard {@link Throwable#getCause()} chain). Matching the
             *    "Cannot contact any host" wrapper text would therefore incorrectly re-label SSL/timeout/refused
             *    errors as "invalid hostname" and hide the real failure from the user.
             *
             * We detect DNS errors two ways:
             *   1. Walk the standard cause chain for an actual {@link UnknownHostException} - catches drivers
             *      that wrap the DNS failure as a proper cause.
             *   2. Scan the full stack trace text for DNS-specific markers (UnknownHostException class name,
             *      Netty's "Failed to resolve" message, the libc "nodename nor servname" message). This catches
             *      driver 7.x where the DNS failure is buried inside ArangoDBMultipleException's aggregated list.
             * Everything else falls through and the user sees the original verbose driver message.
             */
            Throwable cause = externalError;
            while (cause != null) {
                if (cause instanceof UnknownHostException) {
                    return DS_HOSTNAME_MISSING_OR_INVALID_ERROR_MSG;
                }
                cause = cause.getCause();
            }

            String fullStackTrace = ExceptionUtils.getStackTrace(externalError);
            if (fullStackTrace.contains("UnknownHostException")
                    || fullStackTrace.contains("Failed to resolve ")
                    || fullStackTrace.contains("nodename nor servname")) {
                return DS_HOSTNAME_MISSING_OR_INVALID_ERROR_MSG;
            }
        }

        /**
         * Example:
         * Input: ArangoErrorCode: Some issue found.
         * Output: Some issue found
         */
        return CollectionUtils.lastElement(Arrays.asList(error.getMessage().split(":")));
    }
}
