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
    public static void checkHikariCPConnectionPoolValidity(HikariDataSource connectionPool, String pluginName)
            throws StaleConnectionException {
        if (connectionPool == null || connectionPool.isClosed() || !connectionPool.isRunning()) {
            String printMessage = MessageFormat.format(
                    Thread.currentThread().getName()
                            + ": Encountered stale connection pool in {0} plugin. Reporting back.",
                    pluginName);
            System.out.println(printMessage);

            if (connectionPool == null) {
                throw new StaleConnectionException(CONNECTION_POOL_NULL_ERROR_MSG);
            } else if (connectionPool.isClosed()) {
                throw new StaleConnectionException(CONNECTION_POOL_CLOSED_ERROR_MSG);
            } else if (!connectionPool.isRunning()) {
                throw new StaleConnectionException(CONNECTION_POOL_NOT_RUNNING_ERROR_MSG);
            } else {
                /**
                 * Ideally, code flow is never expected to reach here. However, this section has been added to catch
                 * those cases wherein a developer updates the parent if condition but does not update the nested
                 * if else conditions.
                 */
                throw new StaleConnectionException(UNKNOWN_CONNECTION_ERROR_MSG);
            }
        }
    }

    public static Connection getConnectionFromHikariConnectionPool(HikariDataSource connectionPool, String pluginName)
            throws SQLException {
        checkHikariCPConnectionPoolValidity(connectionPool, pluginName);
        return connectionPool.getConnection();
    }
}
