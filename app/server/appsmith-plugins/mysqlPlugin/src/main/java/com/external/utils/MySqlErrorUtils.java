package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.plugins.AppsmithPluginErrorUtils;
import io.r2dbc.spi.R2dbcPermissionDeniedException;

import java.io.Serializable;

public class MySqlErrorUtils extends AppsmithPluginErrorUtils implements Serializable {

    private static MySqlErrorUtils mySqlErrorUtils;

    private MySqlErrorUtils () throws InstantiationException {
        /**
         * Prevention of creating any other new object by using constructor
         */
        if (mySqlErrorUtils != null)
            throw new InstantiationException();
    }

    /**
     * Prevention of creating any other new object by using clone
     */
    @Override
    protected Object clone() throws CloneNotSupportedException {
        return super.clone();
    }

    /**
     * Prevention of creating any other new object by using serialization
     */
    protected Object readResolve() throws InstantiationException {
        return getInstance();
    }

    public static MySqlErrorUtils getInstance() throws InstantiationException {
        if (mySqlErrorUtils == null) {
            synchronized (MySqlErrorUtils.class) {
                if (mySqlErrorUtils == null)
                    mySqlErrorUtils = new MySqlErrorUtils();
            }
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
        if (error instanceof AppsmithPluginException) {
            if (((AppsmithPluginException) error).getExternalError() == null){
                return error.getMessage();
            }
            externalError = ((AppsmithPluginException) error).getExternalError();
        }
        else {
            externalError = error;
        }

        if (externalError instanceof R2dbcPermissionDeniedException) {
            /**
             * Extract small readable portion of error message from a larger less comprehensible error message of R2dbcPermissionDeniedException.
             */
            R2dbcPermissionDeniedException r2dbcPermissionDeniedException = (R2dbcPermissionDeniedException) externalError;
            return r2dbcPermissionDeniedException
                    .getMessage()
                    .replaceAll("\\(|\\)", "")
                    .trim() + ".";
        }
        return error.getMessage().split("\\.")[0].trim() + ".";
    }
}
