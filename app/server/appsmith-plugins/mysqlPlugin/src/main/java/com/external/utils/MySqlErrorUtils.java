package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;
import io.r2dbc.spi.R2dbcNonTransientResourceException;
import io.r2dbc.spi.R2dbcPermissionDeniedException;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class MySqlErrorUtils extends AppsmithPluginErrorUtils {

    private static MySqlErrorUtils mySqlErrorUtils;

    public static MySqlErrorUtils getInstance() {
        if (mySqlErrorUtils == null) {
            mySqlErrorUtils = new MySqlErrorUtils();
        }
        return mySqlErrorUtils;
    }

    /**
     * Extract small readable portion of error message from a larger less comprehensible error message.
     * @param error - any error object
     * @return readable error message
     */
    @Override
    public String getReadableError(Throwable error) {
        Throwable externalError;

        // If the external error is wrapped inside Appsmith error, then extract the external error first.
        if (error instanceof AppsmithPluginException) {
            if (((AppsmithPluginException) error).getExternalError() == null) {
                return error.getMessage();
            }

            externalError = ((AppsmithPluginException) error).getExternalError();
        }
        else {
            externalError = error;
        }

        if (externalError instanceof io.r2dbc.spi.R2dbcNonTransientResourceException) {

            R2dbcNonTransientResourceException r2dbcNonTransientResourceException = (R2dbcNonTransientResourceException) externalError;
            int errorCode = r2dbcNonTransientResourceException.getErrorCode();

            switch (errorCode) {

                case 9000:
                    return r2dbcNonTransientResourceException.getMessage().split("\\(")[0].trim();
                default:
                    return r2dbcNonTransientResourceException.getMessage();
            }
        }

        return externalError.getMessage();
    }
}
