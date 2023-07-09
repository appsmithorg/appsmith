package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;
import com.arangodb.ArangoDBException;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.util.CollectionUtils;

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
            String externalErrorMessage = externalError.getMessage();

            /**
             * Example:
             * Original error message: com.arangodb.ArangoDBException: java.net.UnknownHostException: 1656317e37af
             * .arangodb.cloudx: nodename nor servname provided, or not known
             * Re-formatted error message: Could not find host address. Please edit the 'Host Address' and/or the 'Port' field to
             * provide the desired endpoint.
             */
            if (externalErrorMessage.contains("UnknownHostException")) {
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
