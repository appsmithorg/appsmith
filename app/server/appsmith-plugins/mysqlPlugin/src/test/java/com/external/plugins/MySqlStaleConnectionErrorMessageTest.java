package com.external.plugins;

import com.appsmith.external.configurations.connectionpool.ConnectionPoolConfig;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.ConnectionContext;
import com.external.utils.MySqlDatasourceUtils;
import io.r2dbc.pool.ConnectionPool;
import io.r2dbc.spi.Connection;
import io.r2dbc.spi.R2dbcNonTransientResourceException;
import io.r2dbc.spi.ValidationDepth;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.pool.PoolShutdownException;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;
import java.util.concurrent.TimeoutException;

import static com.external.plugins.exceptions.MySQLErrorMessages.CONNECTION_VALIDITY_CHECK_FAILED_ERROR_MSG;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class MySqlStaleConnectionErrorMessageTest {
    private static class MockConnectionPoolConfig implements ConnectionPoolConfig {
        @Override
        public Mono<Integer> getMaxConnectionPoolSize() {
            return Mono.just(5);
        }
    }

    static MySqlPlugin.MySqlPluginExecutor pluginExecutor = new MySqlPlugin.MySqlPluginExecutor(new MockConnectionPoolConfig());
    static MySqlDatasourceUtils mysqlDatasourceUtils = new MySqlDatasourceUtils();

    @Test
    public void testStaleConnectionExceptionReturnsUpstreamErrorOnTimeoutError() throws TimeoutException {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select 1;");
        ConnectionPool mockConnectionPool = mock(ConnectionPool.class);
        String expectedErrorMessage = "Timeout exception from MockConnectionPool";
        when(mockConnectionPool.create()).thenReturn(Mono.error(new TimeoutException(expectedErrorMessage)));
        ConnectionContext<ConnectionPool> connectionContext =
                new ConnectionContext<ConnectionPool>(mockConnectionPool, null);
        Mono<ActionExecutionResult> actionExecutionResultMono = pluginExecutor.executeCommon(
                connectionContext, actionConfiguration, false, List.of(), new ExecuteActionDTO(), new HashMap<>());
        StepVerifier.create(actionExecutionResultMono)
                .expectErrorSatisfies(error -> {
                    assertTrue(error instanceof StaleConnectionException);
                    assertEquals(expectedErrorMessage, error.getMessage());
                })
                .verify();
    }

    @Test
    public void testStaleConnectionExceptionReturnsUpstreamErrorOnPoolShutdownError() throws TimeoutException {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select 1;");
        ConnectionPool mockConnectionPool = mock(ConnectionPool.class);
        String expectedErrorMessage = "Timeout exception from MockConnectionPool";
        when(mockConnectionPool.create()).thenReturn(Mono.error(new PoolShutdownException(expectedErrorMessage)));
        ConnectionContext<ConnectionPool> connectionContext =
                new ConnectionContext<ConnectionPool>(mockConnectionPool, null);
        Mono<ActionExecutionResult> actionExecutionResultMono = pluginExecutor.executeCommon(
                connectionContext, actionConfiguration, false, List.of(), new ExecuteActionDTO(), new HashMap<>());
        StepVerifier.create(actionExecutionResultMono)
                .expectErrorSatisfies(error -> {
                    assertTrue(error instanceof StaleConnectionException);
                    assertEquals(expectedErrorMessage, error.getMessage());
                })
                .verify();
    }

    @Test
    public void testStaleConnectionExceptionReturnsUpstreamErrorOnIllegalStateError() throws TimeoutException {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select 1;");
        ConnectionPool mockConnectionPool = mock(ConnectionPool.class);
        String expectedErrorMessage = "Timeout exception from MockConnectionPool";
        when(mockConnectionPool.create()).thenReturn(Mono.error(new IllegalStateException(expectedErrorMessage)));
        ConnectionContext<ConnectionPool> connectionContext =
                new ConnectionContext<ConnectionPool>(mockConnectionPool, null);
        Mono<ActionExecutionResult> actionExecutionResultMono = pluginExecutor.executeCommon(
                connectionContext, actionConfiguration, false, List.of(), new ExecuteActionDTO(), new HashMap<>());
        StepVerifier.create(actionExecutionResultMono)
                .expectErrorSatisfies(error -> {
                    assertTrue(error instanceof StaleConnectionException);
                    assertEquals(expectedErrorMessage, error.getMessage());
                })
                .verify();
    }

    @Test
    public void testStaleConnectionExceptionReturnsUpstreamErrorOnResourceError() throws TimeoutException {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select 1;");
        ConnectionPool mockConnectionPool = mock(ConnectionPool.class);
        String expectedErrorMessage = "Timeout exception from MockConnectionPool";
        when(mockConnectionPool.create())
                .thenReturn(Mono.error(new R2dbcNonTransientResourceException(expectedErrorMessage)));
        ConnectionContext<ConnectionPool> connectionContext =
                new ConnectionContext<ConnectionPool>(mockConnectionPool, null);
        Mono<ActionExecutionResult> actionExecutionResultMono = pluginExecutor.executeCommon(
                connectionContext, actionConfiguration, false, List.of(), new ExecuteActionDTO(), new HashMap<>());
        StepVerifier.create(actionExecutionResultMono)
                .expectErrorSatisfies(error -> {
                    assertTrue(error instanceof StaleConnectionException);
                    assertEquals(expectedErrorMessage, error.getMessage());
                })
                .verify();
    }

    @Test
    public void testStaleConnectionExceptionReturnsUpstreamErrorOnInvalidConnection() throws TimeoutException {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select 1;");
        ConnectionPool mockConnectionPool = mock(ConnectionPool.class);
        Connection mockConnection = mock(Connection.class);
        when(mockConnectionPool.create()).thenReturn(Mono.just(mockConnection));
        when(mockConnection.validate(ValidationDepth.LOCAL)).thenReturn(Mono.just(false));
        when(mockConnection.close()).thenReturn(Mono.empty());
        ConnectionContext<ConnectionPool> connectionContext =
                new ConnectionContext<ConnectionPool>(mockConnectionPool, null);
        Mono<ActionExecutionResult> actionExecutionResultMono = pluginExecutor.executeCommon(
                connectionContext, actionConfiguration, false, List.of(), new ExecuteActionDTO(), new HashMap<>());
        StepVerifier.create(actionExecutionResultMono)
                .expectErrorSatisfies(error -> {
                    assertTrue(error instanceof StaleConnectionException);
                    assertEquals(CONNECTION_VALIDITY_CHECK_FAILED_ERROR_MSG, error.getMessage());
                })
                .verify();
    }
}
