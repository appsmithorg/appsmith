package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.zaxxer.hikari.HikariDataSource;

import java.sql.Connection;
import java.sql.SQLException;
import java.text.MessageFormat;

import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_POOL_CLOSED_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_POOL_NOT_RUNNING_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_POOL_NULL_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.UNKNOWN_CONNECTION_ERROR_MSG;

public class SnowflakeDatasourceUtils {
    /**
     * Please note that this method is a duplicate of the identically named method defined in PluginUtils.java. I
     * could not re-use the method in PluginUtils.java because of some Snowflake driver dependency related error that
     * I could not fix even after putting in some significant effort, at which point it seemed like putting any more
     * time would not be a good investment. This dependency error only came up when building with IntelliJ and did
     * not come up when the API server is built and run on terminal. In case the dependency error is fixed, this
     * duplicate method should be removed.
     */
    public static void checkHikariCPConnectionPoolValidity(HikariDataSource connectionPool, String pluginName) throws StaleConnectionException {
        if (connectionPool == null || connectionPool.isClosed() || !connectionPool.isRunning()) {
            String printMessage = MessageFormat.format(Thread.currentThread().getName() +
                    ": Encountered stale connection pool in {0} plugin. Reporting back.", pluginName);
            System.out.println(printMessage);

            if (connectionPool == null) {
                throw new StaleConnectionException(CONNECTION_POOL_NULL_ERROR_MSG);
            }
            else if (connectionPool.isClosed()) {
                throw new StaleConnectionException(CONNECTION_POOL_CLOSED_ERROR_MSG);
            }
            else if (!connectionPool.isRunning()) {
                throw new StaleConnectionException(CONNECTION_POOL_NOT_RUNNING_ERROR_MSG);
            }
            else {
                /**
                 * Ideally, code flow is never expected to reach here. However, this section has been added to catch
                 * those cases wherein a developer updates the parent if condition but does not update the nested
                 * if else conditions.
                 */
                throw new StaleConnectionException(UNKNOWN_CONNECTION_ERROR_MSG);
            }
        }
    }

    /**
     * Please note that this method is a duplicate of the identically named method defined in PluginUtils.java. I
     * could not re-use the method in PluginUtils.java because of some Snowflake driver dependency related error that
     * I could not fix even after putting in some significant effort, at which point it seemed like putting any more
     * time would not be a good investment. This dependency error only came up when building with IntelliJ and did
     * not come up when the API server is built and run on terminal. In case the dependency error is fixed, this
     * duplicate method should be removed.
     */
    public static Connection getConnectionFromHikariConnectionPool(HikariDataSource connectionPool,
                                                                   String pluginName) throws SQLException {
        checkHikariCPConnectionPoolValidity(connectionPool, pluginName);
        return connectionPool.getConnection();
    }
}
