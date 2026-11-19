package com.external.plugins.utils;

import com.external.plugins.exceptions.MssqlErrorMessages;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mockito;

import java.sql.SQLException;
import java.sql.SQLTimeoutException;
import java.sql.Statement;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import static java.lang.Boolean.FALSE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.awaitility.Awaitility.await;
import static org.mockito.Mockito.after;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MssqlExecuteUtilsTest {

    private static final int TIMEOUT_MILLIS = 3000;

    private static final String TIMEOUT_MESSAGE =
            String.format(MssqlErrorMessages.QUERY_TIMEOUT_ERROR_MSG, TIMEOUT_MILLIS);

    @ParameterizedTest
    @CsvSource({"1, 1", "999, 1", "1000, 1", "1001, 2", "10000, 10", "60000, 60", "0, 1"})
    void should_roundUpToWholeSeconds_when_convertingTheActionTimeout(int timeoutMillis, int expectedSeconds) {
        // Given
        // An action timeout in milliseconds.

        // When
        int seconds = MssqlExecuteUtils.queryTimeoutSeconds(timeoutMillis);

        // Then
        assertThat(seconds).isEqualTo(expectedSeconds);
    }

    @Test
    void should_cancelAndFailWithTheTimeout_when_laterResultsDoNotEndBeforeTheDeadline() throws SQLException {
        // Given
        // An update count first, then results without end, and a deadline that has passed.
        Statement statement = Mockito.mock(Statement.class);
        when(statement.getUpdateCount()).thenReturn(1);
        long deadlinePassed = System.nanoTime() - TimeUnit.SECONDS.toNanos(1);

        // When
        Throwable error = catchThrowable(() -> populate(statement, deadlinePassed));

        // Then
        assertThat(error).isInstanceOf(SQLTimeoutException.class).hasMessage(TIMEOUT_MESSAGE);
        verify(statement).cancel();
        // The deadline check stopped the reading before any later result was read.
        verify(statement, never()).getMoreResults();
    }

    @Test
    void should_reportATimeout_when_theDriverStopsTheQueryAfterTheDeadline() throws SQLException {
        // Given
        // The driver's own query timeout ends the query while the later results are read: the read waits until the
        // deadline has passed, then fails.
        Statement statement = Mockito.mock(Statement.class);
        when(statement.getUpdateCount()).thenReturn(1);
        long deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(500);
        SQLException driverTimeout = new SQLException("The query has timed out.", "HY008");
        when(statement.getMoreResults()).thenAnswer(invocation -> {
            await().atMost(Duration.ofSeconds(5)).until(() -> MssqlExecuteUtils.isPastDeadline(deadline));
            throw driverTimeout;
        });

        // When
        Throwable error = catchThrowable(() -> populate(statement, deadline));

        // Then
        verify(statement).getMoreResults();
        assertThat(error).isInstanceOf(SQLTimeoutException.class).hasMessage(TIMEOUT_MESSAGE);
        assertThat(error.getCause()).isSameAs(driverTimeout);
        // Some errors do not end the query, so it is cancelled before the timeout is reported.
        verify(statement).cancel();
    }

    @Test
    void should_cancelTheStatement_when_theDeadlinePassesDuringABlockedRead() throws Exception {
        // Given
        Statement statement = Mockito.mock(Statement.class);
        long deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(50);

        // When
        MssqlExecuteUtils.cancelAtDeadline(statement, deadline);

        // Then
        // The cancel runs on its own thread, shortly after the deadline.
        verify(statement, timeout(5000)).cancel();
    }

    @Test
    void should_notCancelTheStatement_when_theTimerIsStoppedBeforeTheDeadline() throws Exception {
        // Given
        Statement statement = Mockito.mock(Statement.class);
        long deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(200);

        // When
        MssqlExecuteUtils.cancelAtDeadline(statement, deadline).cancel(false);

        // Then
        // Still not cancelled well after the deadline.
        verify(statement, after(400).never()).cancel();
    }

    @Test
    void should_removeTheTaskFromTheQueue_when_theTimerIsStoppedBeforeTheDeadline() {
        // Given
        Statement statement = Mockito.mock(Statement.class);
        long farDeadline = System.nanoTime() + TimeUnit.MINUTES.toNanos(1);
        ScheduledFuture<?> task = MssqlExecuteUtils.cancelAtDeadline(statement, farDeadline);
        int queued = MssqlExecuteUtils.pendingCancels();

        // When
        task.cancel(false);

        // Then
        // A finished query does not stay in the queue until its deadline.
        assertThat(MssqlExecuteUtils.pendingCancels()).isEqualTo(queued - 1);
    }

    @Test
    void should_notCancelTheStatement_when_itIsAlreadyClosedAtTheDeadline() throws Exception {
        // Given
        Statement statement = Mockito.mock(Statement.class);
        when(statement.isClosed()).thenReturn(true);
        long deadline = System.nanoTime();

        // When
        MssqlExecuteUtils.cancelAtDeadline(statement, deadline);

        // Then
        verify(statement, timeout(5000)).isClosed();
        verify(statement, never()).cancel();
    }

    @Test
    void should_reportTheFailedStatement_when_aLaterStatementFailsBeforeTheDeadline() throws SQLException {
        // Given
        Statement statement = Mockito.mock(Statement.class);
        when(statement.getUpdateCount()).thenReturn(1);
        when(statement.getMoreResults()).thenThrow(new SQLException("Invalid object name 'missing'.", "S0002"));
        long deadline = System.nanoTime() + TimeUnit.MINUTES.toNanos(1);

        // When
        Throwable error = catchThrowable(() -> populate(statement, deadline));

        // Then
        assertThat(error)
                .isExactlyInstanceOf(SQLException.class)
                .hasMessageStartingWith("A statement in this query failed.")
                .hasMessageContaining("Invalid object name 'missing'.");
        verify(statement, never()).cancel();
    }

    @Test
    void should_readEveryResult_when_theyEndBeforeTheDeadline() throws SQLException {
        // Given
        // Two more update counts, then the end of the results.
        Statement statement = Mockito.mock(Statement.class);
        when(statement.getMoreResults()).thenReturn(false);
        when(statement.getUpdateCount()).thenReturn(1, 2, 3, -1);
        long deadline = System.nanoTime() + TimeUnit.MINUTES.toNanos(1);

        // When
        List<Map<String, Object>> rows = populate(statement, deadline);

        // Then
        assertThat(rows).containsExactly(Map.of("affectedRows", 1));
        verify(statement, never()).cancel();
    }

    private static List<Map<String, Object>> populate(Statement statement, long deadlineNanos) throws SQLException {
        List<Map<String, Object>> rows = new ArrayList<>();
        MssqlExecuteUtils.populateRowsAndColumns(
                rows, new ArrayList<>(), null, false, FALSE, statement, null, TIMEOUT_MILLIS, deadlineNanos);
        return rows;
    }
}
