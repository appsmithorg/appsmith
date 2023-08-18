package com.external.plugins.utils;

import com.appsmith.external.plugins.SmartSubstitutionInterface;
import oracle.jdbc.OracleArray;
import oracle.jdbc.OracleBlob;
import oracle.sql.CLOB;
import org.apache.commons.lang.ObjectUtils;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.MessageFormat;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import static com.appsmith.external.helpers.PluginUtils.getColumnsListForJdbcPlugin;
import static com.appsmith.external.helpers.PluginUtils.safelyCloseSingleConnectionFromHikariCP;
import static java.lang.Boolean.FALSE;

public class OracleExecuteUtils implements SmartSubstitutionInterface {
    public static final String DATE_COLUMN_TYPE_NAME = "date";
    public static final String TIMESTAMP_TYPE_NAME = "timestamp";
    public static final String TIMESTAMPTZ_TYPE_NAME = "TIMESTAMP WITH TIME ZONE";
    public static final String TIMESTAMPLTZ_TYPE_NAME = "TIMESTAMP WITH LOCAL TIME ZONE";
    public static final String CLOB_TYPE_NAME = "CLOB";
    public static final String NCLOB_TYPE_NAME = "NCLOB";
    public static final String RAW_TYPE_NAME = "RAW";
    public static final String BLOB_TYPE_NAME = "BLOB";
    public static final String AFFECTED_ROWS_KEY = "affectedRows";

    /**
     * Every PL/SQL block must have `BEGIN` and `END` keywords to define the block. Apart from these they could also
     * have the following two optional keywords: `DECLARE` and `EXCEPTION`. The following regex is meant to check for
     * the presence of any one of these keywords to indicate the usage of PL/SQL block.
     * Please note that we convert the query into lowercase before regex match. Also, this regex would not match any
     * of the keywords enclosed within single or double quotes e.g. 'declare' or "declare"
     *
     * Quoting from official Oracle documentation:
     * " A PL/SQL block is defined by the keywords DECLARE, BEGIN, EXCEPTION, and END. These keywords partition the
     * block into a declarative part, an executable part, and an exception-handling part. Only the executable part is
     * required. "
     * Ref: https://docs.oracle.com/cd/B14117_01/appdev.101/b10807/13_elems003.htm#:~:text=A%20PL%2FSQL%20block%20is,the%20executable%20part%20is%20required.
     */
    private static final String PLSQL_MATCH_REGEX =
            "(\\bdeclare\\b(\\s))|(\\bbegin\\b(\\s))|(\\bend\\b(\\s|;))|(\\bexception\\b(\\s))";

    private static final Pattern PL_SQL_MATCH_PATTERN = Pattern.compile(PLSQL_MATCH_REGEX);

    public static void closeConnectionPostExecution(
            ResultSet resultSet, Statement statement, PreparedStatement preparedQuery, Connection connectionFromPool) {
        if (resultSet != null) {
            try {
                resultSet.close();
            } catch (SQLException e) {
                System.out.println(
                        Thread.currentThread().getName() + ": Execute Error closing Oracle ResultSet" + e.getMessage());
            }
        }

        if (statement != null) {
            try {
                statement.close();
            } catch (SQLException e) {
                System.out.println(
                        Thread.currentThread().getName() + ": Execute Error closing Oracle Statement" + e.getMessage());
            }
        }

        if (preparedQuery != null) {
            try {
                preparedQuery.close();
            } catch (SQLException e) {
                System.out.println(
                        Thread.currentThread().getName() + ": Execute Error closing Oracle Statement" + e.getMessage());
            }
        }

        safelyCloseSingleConnectionFromHikariCP(
                connectionFromPool,
                MessageFormat.format(
                        "{0}: Execute Error returning " + "Oracle connection to pool",
                        Thread.currentThread().getName()));
    }

    /**
     * Oracle SQL queries throw error when any delimiter like semicolon is used. Hence, removing it.
     * Ref: https://forums.oracle.com/ords/apexds/post/why-semicolon-not-allowed-in-jdbc-oracle-0099
     */
    public static String removeSemicolonFromQuery(String query) {
        return query.replaceAll(";", "");
    }

    /**
     * PL/SQL cmds have a block structure of the following format: DECLARE...BEGIN...EXCEPTION...END
     * Ref: https://blogs.oracle.com/connect/post/building-with-blocks
     *
     * Oracle supports semicolon as a delimiter with PL/SQL syntax but not with normal SQL.
     * Ref: https://forums.oracle.com/ords/apexds/post/why-semicolon-not-allowed-in-jdbc-oracle-0099
     */
    public static boolean isPLSQL(String query) {
        /**
         * Please don't use Java's String.matches(...) function here because it doesn't behave like normal regex
         * match. It returns true only if the entire string matches the regex as opposed to finding a substring
         * matching the pattern.
         * Ref: https://stackoverflow.com/questions/8923398/regex-doesnt-work-in-string-matches
         */
        return PL_SQL_MATCH_PATTERN.matcher(query.toLowerCase()).find();
    }

    public static void populateRowsAndColumns(
            List<Map<String, Object>> rowsList,
            List<String> columnsList,
            ResultSet resultSet,
            Boolean isResultSet,
            Boolean preparedStatement,
            Statement statement,
            PreparedStatement preparedQuery)
            throws SQLException {
        if (!isResultSet) {
            Object updateCount = FALSE.equals(preparedStatement)
                    ? ObjectUtils.defaultIfNull(statement.getUpdateCount(), 0)
                    : ObjectUtils.defaultIfNull(preparedQuery.getUpdateCount(), 0);

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
                        value = DateTimeFormatter.ISO_DATE.format(
                                resultSet.getDate(i).toLocalDate());

                    } else if (TIMESTAMP_TYPE_NAME.equalsIgnoreCase(typeName)
                            || TIMESTAMPTZ_TYPE_NAME.equalsIgnoreCase(typeName)
                            || TIMESTAMPLTZ_TYPE_NAME.equalsIgnoreCase(typeName)) {
                        value = DateTimeFormatter.ISO_DATE_TIME.format(resultSet.getObject(i, OffsetDateTime.class));
                    } else if (CLOB_TYPE_NAME.equalsIgnoreCase(typeName) || NCLOB_TYPE_NAME.equals(typeName)) {
                        /**
                         * clob, nclob are textual data.
                         * Ref: https://docs.oracle.com/javadb/10.10.1.2/ref/rrefclob.html
                         */
                        value = String.valueOf(
                                ((CLOB) resultSet.getObject(i)).getTarget().getPrefetchedData());
                    } else if (resultSet.getObject(i) instanceof OracleArray) {
                        value = ((OracleArray) resultSet.getObject(i)).getArray();
                    } else if (RAW_TYPE_NAME.equalsIgnoreCase(typeName)) {
                        /**
                         * Raw / Blob data cannot be interpreted as anything but a byte array. Hence, send it back as a
                         * base64 encoded string. The correct way to read the data for these types is for the user to
                         * cast them to a type before reading them, example:
                         * select utl_raw.cast_to_varchar2(c_raw) as c_raw, utl_raw.cast_to_varchar2(c_blob) as c_blob from TYPESTEST4
                         */
                        value = Base64.getEncoder().encodeToString((byte[]) resultSet.getObject(i));
                    } else if (BLOB_TYPE_NAME.equalsIgnoreCase(typeName)) {
                        /**
                         * Raw / Blob data cannot be interpreted as anything but a byte array. Hence, send it back as a
                         * base64 encoded string. The correct way to read the data for these types is for the user to
                         * cast them to a type before reading them, example:
                         * select utl_raw.cast_to_varchar2(c_raw) as c_raw, utl_raw.cast_to_varchar2(c_blob) as c_blob from TYPESTEST4
                         */
                        value = ((OracleBlob) resultSet.getObject(i))
                                .getBytes(1L, (int) ((OracleBlob) resultSet.getObject(i)).length());
                    } else {
                        value = resultSet.getObject(i).toString();
                    }

                    row.put(metaData.getColumnName(i), value);
                }

                rowsList.add(row);
            }
        }
    }
}
