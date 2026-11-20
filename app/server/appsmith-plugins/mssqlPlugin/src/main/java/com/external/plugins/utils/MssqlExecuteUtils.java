package com.external.plugins.utils;

import com.external.plugins.exceptions.MssqlErrorMessages;
import microsoft.sql.DateTimeOffset;
import org.apache.commons.lang3.ObjectUtils;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.SQLTimeoutException;
import java.sql.Statement;
import java.text.MessageFormat;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import static com.appsmith.external.helpers.PluginUtils.getColumnsListForJdbcPlugin;
import static com.appsmith.external.helpers.PluginUtils.safelyCloseSingleConnectionFromHikariCP;
import static java.lang.Boolean.FALSE;

public class MssqlExecuteUtils {

    // 0x followed by upper-case hex digits, the way SQL Server shows binary values.
    private static String toHexLiteral(byte[] bytes) {
        return "0x" + HexFormat.of().withUpperCase().formatHex(bytes);
    }

    private static final String DATE_COLUMN_TYPE_NAME = "date";
    // SQL Server reports a rowversion column as "timestamp", the type's older name.
    private static final Set<String> ROWVERSION_TYPE_NAMES = Set.of("timestamp", "rowversion");
    private static final String DATETIMEOFFSET_TYPE_NAME = "datetimeoffset";
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
            PreparedStatement preparedQuery,
            int timeoutMillis,
            long deadlineNanos)
            throws SQLException {

        Statement executed = FALSE.equals(preparedStatement) ? statement : preparedQuery;

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
                stopAtDeadline(executed, timeoutMillis, deadlineNanos);

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

                    } else if (typeName != null && ROWVERSION_TYPE_NAMES.contains(typeName.toLowerCase(Locale.ROOT))) {
                        // In SQL Server, timestamp is rowversion: 8 binary bytes, not a date. Return them as hex
                        // (0x00000000000007D1), as SQL Server shows them. Reading them as a date failed every query.
                        value = toHexLiteral(resultSet.getBytes(i));

                    } else if (DATETIMEOFFSET_TYPE_NAME.equalsIgnoreCase(typeName)) {
                        // An ISO 8601 string that keeps the offset and every fractional digit, such as
                        // 2024-02-29T13:45:30.1234567+05:30. The driver's own DateTimeOffset object cannot be written
                        // as JSON, so returning it failed every query.
                        value = DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(
                                resultSet.getObject(i, OffsetDateTime.class));

                    } else if (TIMESTAMPTZ_TYPE_NAME.equalsIgnoreCase(typeName)) {
                        value = DateTimeFormatter.ISO_DATE_TIME.format(resultSet.getObject(i, OffsetDateTime.class));

                    } else if (TIME_TYPE_NAME.equalsIgnoreCase(typeName)
                            || TIMETZ_TYPE_NAME.equalsIgnoreCase(typeName)) {
                        value = resultSet.getString(i);

                    } else if (INTERVAL_TYPE_NAME.equalsIgnoreCase(typeName)) {
                        value = resultSet.getObject(i).toString();

                    } else {
                        value = resultSet.getObject(i);

                        // A sql_variant column reports its own type name, so a datetimeoffset stored in one arrives
                        // here as the driver's object. Return it in the same ISO 8601 form as a datetimeoffset column.
                        if (value instanceof DateTimeOffset dateTimeOffset) {
                            value = DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(dateTimeOffset.getOffsetDateTime());
                        }
                    }

                    row.put(metaData.getColumnName(i), value);
                }

                rowsList.add(row);
            }
        }

        drainRemainingResults(executed, timeoutMillis, deadlineNanos);
    }

    /**
     * Returns the JDBC query timeout, in whole seconds, for an action timeout in milliseconds. Rounds up, so the
     * driver never stops a query before the action's own timeout. JDBC treats 0 as no timeout, so the result is at
     * least 1.
     */
    public static int queryTimeoutSeconds(int timeoutMillis) {
        return (int) Math.max(1, (timeoutMillis + 999L) / 1000);
    }

    /** Returns true when the action's timeout has passed. */
    public static boolean isPastDeadline(long deadlineNanos) {
        return System.nanoTime() - deadlineNanos >= 0;
    }

    /**
     * Cancels the statement on SQL Server at the deadline, from another thread. A read of the results can block
     * inside the driver, for example while a later statement runs {@code WAITFOR}, and the driver's own query
     * timeout no longer runs once the first response has arrived. The checks between reads cannot interrupt such a
     * read. Cancelling ends it with an error.
     *
     * <p>The caller must cancel the returned task before it closes the statement and returns the connection to the
     * pool.
     */
    public static ScheduledFuture<?> cancelAtDeadline(Statement statement, long deadlineNanos) {
        long delayNanos = Math.max(0, deadlineNanos - System.nanoTime());
        // The timer thread only starts the cancel. Sending it to a stalled server can block, and that must not
        // delay the cancels of other queries.
        return CANCEL_TIMER.schedule(
                () -> CANCEL_THREADS.start(() -> {
                    try {
                        if (!statement.isClosed()) {
                            statement.cancel();
                        }
                    } catch (SQLException e) {
                        // The statement finished or was closed meanwhile. Nothing is left to cancel.
                    }
                }),
                delayNanos,
                TimeUnit.NANOSECONDS);
    }

    /**
     * One daemon thread that starts the cancels at their deadlines. A task stopped before its deadline leaves the
     * queue at once, so finished queries do not pile up in it.
     */
    private static final ScheduledThreadPoolExecutor CANCEL_TIMER = newCancelTimer();

    /** Each cancel runs on its own virtual thread. */
    private static final Thread.Builder CANCEL_THREADS = Thread.ofVirtual().name("mssql-query-cancel-", 0);

    private static ScheduledThreadPoolExecutor newCancelTimer() {
        ScheduledThreadPoolExecutor timer = new ScheduledThreadPoolExecutor(1, task -> {
            Thread thread = new Thread(task, "mssql-query-cancel-timer");
            thread.setDaemon(true);
            return thread;
        });
        timer.setRemoveOnCancelPolicy(true);
        return timer;
    }

    /** The number of cancels waiting for their deadline. For tests. */
    static int pendingCancels() {
        return CANCEL_TIMER.getQueue().size();
    }

    /** Fails the query with a timeout when the action's timeout has passed. */
    private static void stopAtDeadline(Statement statement, int timeoutMillis, long deadlineNanos) throws SQLException {
        if (isPastDeadline(deadlineNanos)) {
            throw cancelForTimeout(statement, timeoutMillis, null);
        }
    }

    /**
     * Cancels the query on SQL Server and returns the timeout error. Closing the statement afterwards would otherwise
     * read every remaining result, which can go on without end.
     *
     * @param cause the error the driver raised after the deadline, or null
     */
    private static DeadlineReached cancelForTimeout(Statement statement, int timeoutMillis, SQLException cause) {
        DeadlineReached timeout = new DeadlineReached(timeoutMillis);
        if (cause != null) {
            timeout.initCause(cause);
        }
        if (statement != null) {
            try {
                statement.cancel();
            } catch (SQLException e) {
                // Still report the timeout.
                timeout.addSuppressed(e);
            }
        }
        return timeout;
    }

    /** The plugin's own timeout error, so that it is not reported as a failed statement. */
    private static final class DeadlineReached extends SQLTimeoutException {
        private DeadlineReached(int timeoutMillis) {
            super(String.format(MssqlErrorMessages.QUERY_TIMEOUT_ERROR_MSG, timeoutMillis));
        }
    }

    /**
     * Reads the results of the remaining statements in a query. The response still shows only the first result, but
     * the driver raises an error from a later statement only when its result is read. Without this, a query such as
     * {@code UPDATE ...; INSERT INTO missing_table ...} reported success. Other statements may already have run: the
     * ones before the error, and, because SQL Server continues after many statement errors, some after it. Without an
     * explicit transaction they are committed. So the error says so.
     *
     * <p>A query can return results without end, for example {@code WHILE 1 = 1 SELECT 1}. So the reading stops at
     * the action's timeout: the query is cancelled on SQL Server and fails with a timeout error.
     */
    private static void drainRemainingResults(Statement statement, int timeoutMillis, long deadlineNanos)
            throws SQLException {
        if (statement == null) {
            return;
        }

        try {
            while (true) {
                stopAtDeadline(statement, timeoutMillis, deadlineNanos);
                if (statement.getMoreResults()) {
                    // A later SELECT can fail while its rows are read, for example on a divide by zero in row 5.
                    // Step through its rows (they are not returned) so that error surfaces too.
                    try (ResultSet laterRows = statement.getResultSet()) {
                        while (laterRows != null && laterRows.next()) {
                            stopAtDeadline(statement, timeoutMillis, deadlineNanos);
                        }
                    }
                } else if (statement.getUpdateCount() == -1) {
                    break;
                }
            }
        } catch (DeadlineReached e) {
            throw e;
        } catch (SQLException e) {
            if (isPastDeadline(deadlineNanos)) {
                // A cancel at the deadline, or any other error after it. Some errors do not end the query, so
                // cancel it before reporting the timeout.
                throw cancelForTimeout(statement, timeoutMillis, e);
            }
            throw new SQLException(
                    "A statement in this query failed. Other statements in the query may already have run."
                            + (e.getMessage() == null ? "" : " " + e.getMessage()),
                    e.getSQLState(),
                    e.getErrorCode(),
                    e);
        }
    }
}
