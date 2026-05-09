package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;
import com.arangodb.ArangoDBException;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
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
             * The underlying signal we want to detect is "the configured host could not be reached". This shows up
             * differently across driver versions:
             *  - Driver 6 surfaced "java.net.UnknownHostException: ..." in the top-level message string.
             *  - Driver 7 (Vert.x WebClient) consolidates host-reachability failures under "Cannot contact any
             *    host!" with the original {@link UnknownHostException} attached as a cause in the chain.
             *
             * We walk the cause chain for {@link UnknownHostException} and also match the known top-level message
             * patterns so we keep producing the same friendly error to the user.
             */
            Throwable cause = externalError;
            while (cause != null) {
                if (cause instanceof UnknownHostException) {
                    return DS_HOSTNAME_MISSING_OR_INVALID_ERROR_MSG;
                }
                cause = cause.getCause();
            }

            String externalErrorMessage = externalError.getMessage();
            if (externalErrorMessage != null
                    && (externalErrorMessage.contains("UnknownHostException")
                            || externalErrorMessage.contains("Cannot contact any host"))) {
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
