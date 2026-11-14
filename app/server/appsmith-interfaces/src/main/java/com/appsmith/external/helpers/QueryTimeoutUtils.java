package com.appsmith.external.helpers;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.services.SharedConfig;

import java.sql.SQLException;
import java.sql.SQLTimeoutException;
import java.sql.Statement;

public final class QueryTimeoutUtils {

    private static final String QUERY_CANCELED_SQL_STATE = "57014";

    private QueryTimeoutUtils() {}

    public static boolean isCancelEnabled(SharedConfig sharedConfig) {
        return sharedConfig != null && sharedConfig.isQueryTimeoutCancelEnabled();
    }

    public static int toJdbcSeconds(int timeoutInMillisecond) {
        return Math.max(1, (int) Math.ceil(timeoutInMillisecond / 1000.0));
    }

    public static void applyQueryTimeout(
            Statement statement, ActionConfiguration actionConfiguration, boolean cancelEnabled) throws SQLException {
        if (!cancelEnabled || statement == null || actionConfiguration == null) {
            return;
        }
        statement.setQueryTimeout(toJdbcSeconds(actionConfiguration.getTimeoutInMillisecond()));
    }

    public static boolean isQueryTimeoutCancellation(SQLException exception, boolean cancelEnabled) {
        return cancelEnabled
                && (exception instanceof SQLTimeoutException
                        || QUERY_CANCELED_SQL_STATE.equals(exception.getSQLState()));
    }

    public static AppsmithPluginException queryTimeoutError(int timeoutInMillisecond, SQLException exception) {
        return new AppsmithPluginException(
                AppsmithPluginError.PLUGIN_QUERY_TIMEOUT_ERROR,
                "Query",
                timeoutInMillisecond,
                exception.getMessage(),
                "SQLSTATE: " + exception.getSQLState());
    }
}
