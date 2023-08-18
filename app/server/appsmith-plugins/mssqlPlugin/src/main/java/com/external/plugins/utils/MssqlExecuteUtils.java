package com.external.plugins.utils;

import org.apache.commons.lang.ObjectUtils;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.MessageFormat;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.getColumnsListForJdbcPlugin;
import static com.appsmith.external.helpers.PluginUtils.safelyCloseSingleConnectionFromHikariCP;
import static java.lang.Boolean.FALSE;

public class MssqlExecuteUtils {

    private static final String DATE_COLUMN_TYPE_NAME = "date";
    private static final String TIMESTAMP_TYPE_NAME = "timestamp";
    private static final String TIMESTAMPTZ_TYPE_NAME = "timestamptz";
    private static final String TIME_TYPE_NAME = "time";
    private static final String TIMETZ_TYPE_NAME = "timetz";
    private static final String INTERVAL_TYPE_NAME = "interval";

    public static void closeConnectionPostExecution(
            ResultSet resultSet, Statement statement, PreparedStatement preparedQuery, Connection connectionFromPool) {
        if (resultSet != null) {
            try {
                resultSet.close();
            } catch (SQLException e) {
                System.out.println(
                        Thread.currentThread().getName() + ": Execute Error closing Mssql ResultSet" + e.getMessage());
            }
        }

        if (statement != null) {
            try {
                statement.close();
            } catch (SQLException e) {
                System.out.println(
                        Thread.currentThread().getName() + ": Execute Error closing Mssql Statement" + e.getMessage());
            }
        }

        if (preparedQuery != null) {
            try {
                preparedQuery.close();
            } catch (SQLException e) {
                System.out.println(
                        Thread.currentThread().getName() + ": Execute Error closing Mssql Statement" + e.getMessage());
            }
        }

        safelyCloseSingleConnectionFromHikariCP(
                connectionFromPool,
                MessageFormat.format(
                        "{0}: Execute Error returning " + "Oracle connection to pool",
                        Thread.currentThread().getName()));
    }

    public static void populateRowsAndColumns(
            List<Map<String, Object>> rowsList,
            List<String> columnsList,
            ResultSet resultSet,
            boolean isResultSet,
            Boolean preparedStatement,
            Statement statement,
            PreparedStatement preparedQuery)
            throws SQLException {

        if (!isResultSet) {
            Object updateCount = FALSE.equals(preparedStatement)
                    ? ObjectUtils.defaultIfNull(statement.getUpdateCount(), 0)
                    : ObjectUtils.defaultIfNull(preparedQuery.getUpdateCount(), 0);

            rowsList.add(Map.of("affectedRows", updateCount));
        } else {
            ResultSetMetaData metaData = resultSet.getMetaData();
            int colCount = metaData.getColumnCount();
            columnsList.addAll(getColumnsListForJdbcPlugin(metaData));

            while (resultSet.next()) {
                // Use `LinkedHashMap` here so that the column ordering is preserved in the response.
                Map<String, Object> row = new LinkedHashMap<>(colCount);

                for (int i = 1; i <= colCount; i++) {
                    Object value;
                    final String typeName = metaData.getColumnTypeName(i);

                    if (resultSet.getObject(i) == null) {
                        value = null;

                    } else if (DATE_COLUMN_TYPE_NAME.equalsIgnoreCase(typeName)) {
                        value = DateTimeFormatter.ISO_DATE.format(
                                resultSet.getDate(i).toLocalDate());

                    } else if (TIMESTAMP_TYPE_NAME.equalsIgnoreCase(typeName)) {
                        value = DateTimeFormatter.ISO_DATE_TIME.format(LocalDateTime.of(
                                        resultSet.getDate(i).toLocalDate(),
                                        resultSet.getTime(i).toLocalTime()))
                                + "Z";

                    } else if (TIMESTAMPTZ_TYPE_NAME.equalsIgnoreCase(typeName)) {
                        value = DateTimeFormatter.ISO_DATE_TIME.format(resultSet.getObject(i, OffsetDateTime.class));

                    } else if (TIME_TYPE_NAME.equalsIgnoreCase(typeName)
                            || TIMETZ_TYPE_NAME.equalsIgnoreCase(typeName)) {
                        value = resultSet.getString(i);

                    } else if (INTERVAL_TYPE_NAME.equalsIgnoreCase(typeName)) {
                        value = resultSet.getObject(i).toString();

                    } else {
                        value = resultSet.getObject(i);
                    }

                    row.put(metaData.getColumnName(i), value);
                }

                rowsList.add(row);
            }
        }
    }
}
