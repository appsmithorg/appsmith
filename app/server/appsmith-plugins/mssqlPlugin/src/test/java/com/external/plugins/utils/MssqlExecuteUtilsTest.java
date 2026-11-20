package com.external.plugins.utils;

import com.external.plugins.exceptions.MssqlErrorMessages;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InOrder;
import org.mockito.Mockito;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.SQLTimeoutException;
import java.sql.Statement;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.locks.ReentrantLock;

import static java.lang.Boolean.FALSE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.awaitility.Awaitility.await;
import static org.mockito.Mockito.after;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.inOrder;
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
        // A deadline far enough away that a slow test machine still stops the timer first.
        long deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(1000);

        // When
        boolean reusable =
                MssqlExecuteUtils.cancelAtDeadline(statement, deadline).stop();

        // Then
        assertThat(reusable).isTrue();
        // Still not cancelled well after the deadline.
        verify(statement, after(1500).never()).cancel();
    }

    // AIP-FD-39: the timer has started the cancel, but the cancel has not taken the lock yet. A stop() in that window
    // must win: the cancel must not run afterwards, and the connection can be reused.
    @Test
    void should_neverCancel_when_stopComesBetweenTheTimerAndTheCancel() throws Exception {
        // Given: the test holds the lock, so the cancel the timer started waits for it.
        Statement statement = Mockito.mock(Statement.class);
        MssqlExecuteUtils.DeadlineCancel cancel =
                MssqlExecuteUtils.cancelAtDeadline(statement, System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(50));
        ReentrantLock lock = cancel.lockForTests();
        lock.lock();
        CompletableFuture<Boolean> stop;
        try {
            await().atMost(Duration.ofSeconds(5)).until(lock::hasQueuedThreads);

            // When: stop() is called, and also waits for the lock.
            stop = CompletableFuture.supplyAsync(cancel::stop);
            await().atMost(Duration.ofSeconds(5)).until(() -> lock.getQueueLength() == 2);
        } finally {
            lock.unlock();
        }

        // Then: whichever gets the lock first, the cancel does not run and the connection can be reused.
        assertThat(stop.get(5, TimeUnit.SECONDS)).isTrue();
        verify(statement, after(300).never()).cancel();
    }

    @Test
    void should_notReuseTheConnection_when_aCancelRanBeforeTheStop() throws Exception {
        // Given
        Statement statement = Mockito.mock(Statement.class);
        MssqlExecuteUtils.DeadlineCancel cancel = MssqlExecuteUtils.cancelAtDeadline(statement, System.nanoTime());
        verify(statement, timeout(5000)).cancel();

        // When
        boolean reusable = cancel.stop();

        // Then
        assertThat(reusable).isFalse();
    }

    // AIP-FD-39: a cancel that the timer has already started must finish before the connection can go back to the
    // pool. Otherwise it can reach SQL Server later and stop the next query on that connection.
    @Test
    void should_waitForARunningCancel_when_stopping() throws Exception {
        // Given: the cancel is sending to SQL Server and has not finished.
        Statement statement = Mockito.mock(Statement.class);
        CountDownLatch cancelStarted = new CountDownLatch(1);
        CountDownLatch releaseCancel = new CountDownLatch(1);
        doAnswer(invocation -> {
                    cancelStarted.countDown();
                    releaseCancel.await(10, TimeUnit.SECONDS);
                    return null;
                })
                .when(statement)
                .cancel();
        MssqlExecuteUtils.DeadlineCancel cancel = MssqlExecuteUtils.cancelAtDeadline(statement, System.nanoTime());
        try {
            assertThat(cancelStarted.await(5, TimeUnit.SECONDS)).isTrue();

            // When
            CompletableFuture<Boolean> stop = CompletableFuture.supplyAsync(cancel::stop);

            // Then: stop waits for the cancel, then says the connection must not be reused.
            assertThat(catchThrowable(() -> stop.get(300, TimeUnit.MILLISECONDS)))
                    .isInstanceOf(TimeoutException.class);
            releaseCancel.countDown();
            assertThat(stop.get(5, TimeUnit.SECONDS)).isFalse();
        } finally {
            releaseCancel.countDown();
        }
    }

    @Test
    void should_notReuseTheConnection_when_aCancelIsStillRunningAfterTheWait() throws Exception {
        // Given: the cancel hangs, for example on a server that stopped answering.
        Statement statement = Mockito.mock(Statement.class);
        CountDownLatch cancelStarted = new CountDownLatch(1);
        CountDownLatch releaseCancel = new CountDownLatch(1);
        doAnswer(invocation -> {
                    cancelStarted.countDown();
                    releaseCancel.await(30, TimeUnit.SECONDS);
                    return null;
                })
                .when(statement)
                .cancel();
        MssqlExecuteUtils.DeadlineCancel cancel = MssqlExecuteUtils.cancelAtDeadline(statement, System.nanoTime());
        assertThat(cancelStarted.await(5, TimeUnit.SECONDS)).isTrue();

        try {
            // When
            long start = System.nanoTime();
            boolean reusable = cancel.stop();

            // Then: stop gives up after its wait, and the connection is not reused.
            assertThat(reusable).isFalse();
            assertThat(Duration.ofNanos(System.nanoTime() - start))
                    .isGreaterThanOrEqualTo(Duration.ofMillis(MssqlExecuteUtils.DeadlineCancel.STOP_WAIT_MILLIS - 100));
        } finally {
            releaseCancel.countDown();
        }
    }

    @Test
    void should_removeTheConnectionFromThePool_when_itIsNotReusable() throws Exception {
        // Given
        Statement statement = Mockito.mock(Statement.class);
        Connection connection = Mockito.mock(Connection.class);
        HikariDataSource pool = Mockito.mock(HikariDataSource.class);

        // When
        MssqlExecuteUtils.closeConnectionPostExecution(null, statement, null, connection, pool, false);

        // Then: removed first, so closing the statement cannot wait on a server that stopped answering.
        InOrder order = inOrder(pool, statement);
        order.verify(pool).evictConnection(connection);
        order.verify(statement).close();
        verify(connection, never()).close();
    }

    @Test
    void should_closeTheConnectionToSqlServer_when_thePoolCannotRemoveIt() throws Exception {
        // Given
        Connection connection = Mockito.mock(Connection.class);
        Connection physicalConnection = Mockito.mock(Connection.class);
        when(connection.unwrap(Connection.class)).thenReturn(physicalConnection);
        HikariDataSource pool = Mockito.mock(HikariDataSource.class);
        Mockito.doThrow(new IllegalStateException("pool error")).when(pool).evictConnection(connection);

        // When
        MssqlExecuteUtils.closeConnectionPostExecution(null, null, null, connection, pool, false);

        // Then: the session on SQL Server ends before the connection goes back to the pool.
        InOrder order = inOrder(physicalConnection, connection);
        order.verify(physicalConnection).close();
        order.verify(connection).close();
    }

    @Test
    void should_closeTheConnection_when_itIsNotReusableAndThePoolIsClosed() throws Exception {
        // Given: Hikari ignores an eviction once the pool is closed.
        Connection connection = Mockito.mock(Connection.class);
        HikariDataSource pool = Mockito.mock(HikariDataSource.class);
        when(pool.isClosed()).thenReturn(true);

        // When
        MssqlExecuteUtils.closeConnectionPostExecution(null, null, null, connection, pool, false);

        // Then
        verify(connection).close();
        verify(pool, never()).evictConnection(Mockito.any());
    }

    @Test
    void should_returnTheConnectionToThePool_when_itIsReusable() throws Exception {
        // Given
        Statement statement = Mockito.mock(Statement.class);
        Connection connection = Mockito.mock(Connection.class);
        HikariDataSource pool = Mockito.mock(HikariDataSource.class);

        // When
        MssqlExecuteUtils.closeConnectionPostExecution(null, statement, null, connection, pool, true);

        // Then
        verify(connection).close();
        verify(pool, never()).evictConnection(Mockito.any());
    }

    @Test
    void should_removeTheTaskFromTheQueue_when_theTimerIsStoppedBeforeTheDeadline() {
        // Given
        Statement statement = Mockito.mock(Statement.class);
        long farDeadline = System.nanoTime() + TimeUnit.MINUTES.toNanos(1);
        MssqlExecuteUtils.DeadlineCancel task = MssqlExecuteUtils.cancelAtDeadline(statement, farDeadline);
        int queued = MssqlExecuteUtils.pendingCancels();

        // When
        task.stop();

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
