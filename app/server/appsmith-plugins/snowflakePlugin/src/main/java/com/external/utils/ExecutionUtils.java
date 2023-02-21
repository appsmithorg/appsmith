package com.external.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.external.plugins.exceptions.SnowflakeErrorMessages;
import com.external.plugins.exceptions.SnowflakePluginError;
import lombok.extern.slf4j.Slf4j;
import net.snowflake.client.jdbc.SnowflakeReauthenticationRequest;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
public class ExecutionUtils {
    /**
     * Execute query and return the resulting table as a list of rows.
     *
     * @param connection - Connection object to execute query.
     * @param query      - Query string
     * @return List of rows from the response table.
     * @throws AppsmithPluginException
     * @throws StaleConnectionException
     */
    public static List<Map<String, Object>> getRowsFromQueryResult(Connection connection, String query) throws
            AppsmithPluginException, StaleConnectionException {
        List<Map<String, Object>> rowsList = new ArrayList<>();
        ResultSet resultSet = null;
        Statement statement = null;
        try {
            // We do not use keep alive threads for our connections since these might become expensive
            // Instead for every execution, we check for connection validity,
            // and reset the connection if required
            if (!connection.isValid(30)) {
                throw new StaleConnectionException();
            }

            statement = connection.createStatement();
            resultSet = statement.executeQuery(query);
            ResultSetMetaData metaData = resultSet.getMetaData();
            int colCount = metaData.getColumnCount();

            while (resultSet.next()) {
                // Use `LinkedHashMap` here so that the column ordering is preserved in the response.
                Map<String, Object> row = new LinkedHashMap<>(colCount);

                for (int i = 1; i <= colCount; i++) {
                    Object value = resultSet.getObject(i);
                    row.put(metaData.getColumnName(i), value);
                }
                rowsList.add(row);
            }
        } catch (SQLException e) {
            if (e instanceof SnowflakeReauthenticationRequest) {
                throw new StaleConnectionException();
            }
            log.error("Exception caught when executing Snowflake query. Cause: ", e);
            throw new AppsmithPluginException(SnowflakePluginError.QUERY_EXECUTION_FAILED, SnowflakeErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG, e.getMessage(), "SQLSTATE: " + e.getSQLState() );

        } finally {
            if (resultSet != null) {
                try {
                    resultSet.close();
                } catch (SQLException e) {
                    log.error("Unable to close Snowflake resultSet. Cause: ", e);
                }
            }
            if (statement != null) {
                try {
                    statement.close();
                } catch (SQLException e) {
                    log.error("Unable to close Snowflake statement. Cause: ", e);
                }
            }
        }

        return rowsList;
    }
}
