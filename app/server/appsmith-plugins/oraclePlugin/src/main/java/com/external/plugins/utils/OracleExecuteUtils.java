package com.external.plugins.utils;

import com.appsmith.external.plugins.SmartSubstitutionInterface;
import oracle.sql.Datum;
import org.apache.commons.lang.ObjectUtils;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.getColumnsListForJdbcPlugin;
import static java.lang.Boolean.FALSE;

public class OracleExecuteUtils implements SmartSubstitutionInterface {
    public static final String DATE_COLUMN_TYPE_NAME = "date";
    public static final String TIMESTAMP_TYPE_NAME = "timestamp";
    public static final String TIMESTAMPTZ_TYPE_NAME = "TIMESTAMP WITH TIME ZONE";
    public static final String INTERVAL_TYPE_NAME = "interval";
    public static final String AFFECTED_ROWS_KEY = "affectedRows";

    public static void closeConnectionPostExecution(ResultSet resultSet, Statement statement,
                                                    PreparedStatement preparedQuery, Connection connectionFromPool) {
        if (resultSet != null) {
            try {
                resultSet.close();
            } catch (SQLException e) {
                System.out.println(Thread.currentThread().getName() +
                        ": Execute Error closing Oracle ResultSet" + e.getMessage());
            }
        }

        if (statement != null) {
            try {
                statement.close();
            } catch (SQLException e) {
                System.out.println(Thread.currentThread().getName() +
                        ": Execute Error closing Oracle Statement" + e.getMessage());
            }
        }

        if (preparedQuery != null) {
            try {
                preparedQuery.close();
            } catch (SQLException e) {
                System.out.println(Thread.currentThread().getName() +
                        ": Execute Error closing Oracle Statement" + e.getMessage());
            }
        }

        if (connectionFromPool != null) {
            try {
                // Return the connection back to the pool
                connectionFromPool.close();
            } catch (SQLException e) {
                System.out.println(Thread.currentThread().getName() +
                        ": Execute Error returning Oracle connection to pool" + e.getMessage());
            }
        }
    }

    /**
     * Oracle SQL queries throw error when any delimiter like semicolon is used. Hence, removing it.
     * Ref: https://forums.oracle.com/ords/apexds/post/why-semicolon-not-allowed-in-jdbc-oracle-0099
     */
    public static String removeSemicolonFromQuery(String query) {
        return query.replaceAll(";", "");
    }

    public static void populateRowsAndColumns(List<Map<String, Object>> rowsList, List<String> columnsList,
                                              ResultSet resultSet, Boolean isResultSet, Boolean preparedStatement,
                                              Statement statement, PreparedStatement preparedQuery) throws SQLException {
        if (!isResultSet) {
            Object updateCount = FALSE.equals(preparedStatement) ?
                    ObjectUtils.defaultIfNull(statement.getUpdateCount(), 0) :
                    ObjectUtils.defaultIfNull(preparedQuery.getUpdateCount(), 0);

            rowsList.add(Map.of(AFFECTED_ROWS_KEY, updateCount));
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
                        value = DateTimeFormatter.ISO_DATE.format(resultSet.getDate(i).toLocalDate());

                    } else if (TIMESTAMP_TYPE_NAME.equalsIgnoreCase(typeName)) {
                        value = DateTimeFormatter.ISO_DATE_TIME.format(
                                LocalDateTime.of(
                                        resultSet.getDate(i).toLocalDate(),
                                        resultSet.getTime(i).toLocalTime()
                                )
                        ) + "Z";

                    } else if (TIMESTAMPTZ_TYPE_NAME.equalsIgnoreCase(typeName)) {
                        value = DateTimeFormatter.ISO_DATE_TIME.format(
                                resultSet.getObject(i, OffsetDateTime.class)
                        );

                    } else if (INTERVAL_TYPE_NAME.equalsIgnoreCase(typeName)) {
                        value = resultSet.getObject(i).toString();

                    } else {
                        value = resultSet.getObject(i);

                        /**
                         * Any type that JDBC does not understand gets mapped to PGobject. PGobject has
                         * two attributes: type and value. Hence, when PGobject gets serialized, it gets
                         * converted into a JSON like {"type":"citext", "value":"someText"}. Since we are
                         * only interested in the value and not the type, it makes sense to extract out
                         * the value as a string.
                         * Reference: https://jdbc.postgresql.org/documentation/publicapi/org/oracleql/util/PGobject.html
                         */
                        if (value instanceof Datum) {
                            value = new String(((Datum) value).getBytes());
                        }
                    }

                    row.put(metaData.getColumnName(i), value);
                }

                rowsList.add(row);
            }
        }
    }
}
