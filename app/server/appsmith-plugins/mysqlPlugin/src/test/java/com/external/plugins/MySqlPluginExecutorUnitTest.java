package com.external.plugins;

import com.appsmith.external.configurations.connectionpool.ConnectionPoolConfig;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.helpers.SSHTunnelContext;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ConnectionContext;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSHConnection;
import com.appsmith.external.models.SSLDetails;
import io.micrometer.observation.ObservationRegistry;
import io.r2dbc.pool.ConnectionPool;
import io.r2dbc.spi.Connection;
import io.r2dbc.spi.R2dbcNonTransientResourceException;
import io.r2dbc.spi.Statement;
import io.r2dbc.spi.ValidationDepth;
import net.schmizz.sshj.SSHClient;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.net.ServerSocket;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.appsmith.external.models.Connection.Mode.READ_WRITE;
import static com.external.plugins.exceptions.MySQLErrorMessages.CONNECTION_VALIDITY_CHECK_FAILED_ERROR_MSG;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Mock-based unit tests for {@link MySqlPlugin.MySqlPluginExecutor} that cover the pure helpers and the datasource
 * lifecycle (create / destroy / test / structure) without needing a live MySQL server. These complement the
 * Testcontainers-based MySqlPluginTest, which cannot run without Docker.
 */
public class MySqlPluginExecutorUnitTest {

    private static class MockConnectionPoolConfig implements ConnectionPoolConfig {
        @Override
        public Mono<Integer> getMaxConnectionPoolSize() {
            return Mono.just(5);
        }
    }

    static MySqlPlugin.MySqlPluginExecutor pluginExecutor =
            new MySqlPlugin.MySqlPluginExecutor(new MockConnectionPoolConfig(), ObservationRegistry.NOOP);

    private DatasourceConfiguration standardConfig() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();

        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null);
        properties.add(new Property("Connection method", "STANDARD"));
        dsConfig.setProperties(properties);

        com.appsmith.external.models.Connection connection = new com.appsmith.external.models.Connection();
        connection.setMode(READ_WRITE);
        connection.setSsl(new SSLDetails());
        connection.getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);
        dsConfig.setConnection(connection);

        ArrayList<Endpoint> endpoints = new ArrayList<>();
        endpoints.add(new Endpoint("mysqlHost", 3306L));
        dsConfig.setEndpoints(endpoints);

        dsConfig.setAuthentication(new DBAuth(null, "username", "password", "dbname"));

        return dsConfig;
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_standard() {
        StepVerifier.create(pluginExecutor.getEndpointIdentifierForRateLimit(standardConfig()))
                .assertNext(identifier -> assertEquals("mysqlHost_3306", identifier))
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_sshEnabled_appendsSshHostAndPort() {
        DatasourceConfiguration dsConfig = standardConfig();
        dsConfig.getProperties().set(1, new Property("Connection method", "SSH"));
        SSHConnection sshProxy = new SSHConnection();
        sshProxy.setHost("sshHost");
        sshProxy.setPort(2222L);
        dsConfig.setSshProxy(sshProxy);

        StepVerifier.create(pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig))
                .assertNext(identifier -> assertEquals("mysqlHost_3306_sshHost_2222", identifier))
                .verifyComplete();
    }

    @Test
    public void testIsIsOperatorUsed() {
        assertTrue(pluginExecutor.isIsOperatorUsed("SELECT * FROM t WHERE active IS TRUE"));
        assertFalse(pluginExecutor.isIsOperatorUsed("SELECT id FROM users"));
    }

    @Test
    public void testGetSchemaPreviewActionConfig_disablesPreparedStatement() {
        DatasourceStructure.Template template = new DatasourceStructure.Template("title", "SELECT 1", false);

        ActionConfiguration actionConfig = pluginExecutor.getSchemaPreviewActionConfig(template, false);

        assertEquals("SELECT 1", actionConfig.getBody());
        assertEquals(false, actionConfig.getPluginSpecifiedTemplates().get(0).getValue());
    }

    @Test
    public void testTestDatasource_success_hasNoInvalids() {
        ConnectionPool pool = mock(ConnectionPool.class);
        Connection connection = mock(Connection.class);
        when(pool.create()).thenReturn(Mono.just(connection));
        when(connection.close()).thenReturn(Mono.empty());
        ConnectionContext<ConnectionPool> ctx = new ConnectionContext<>(pool, null);

        StepVerifier.create(pluginExecutor.testDatasource(ctx))
                .assertNext(result -> assertTrue(
                        result.getInvalids() == null || result.getInvalids().isEmpty()))
                .verifyComplete();
    }

    @Test
    public void testTestDatasource_connectionFailure_reportsInvalid() {
        ConnectionPool pool = mock(ConnectionPool.class);
        when(pool.create()).thenReturn(Mono.error(new RuntimeException("connection refused")));
        ConnectionContext<ConnectionPool> ctx = new ConnectionContext<>(pool, null);

        StepVerifier.create(pluginExecutor.testDatasource(ctx))
                .assertNext(result -> assertFalse(result.getInvalids().isEmpty()))
                .verifyComplete();
    }

    @Test
    public void testDatasourceCreate_standard_buildsPoolWithoutTunnel() {
        StepVerifier.create(pluginExecutor.datasourceCreate(standardConfig()))
                .assertNext(ctx -> {
                    assertNotNull(ctx.getConnection());
                    assertNull(ctx.getSshTunnelContext());
                    ctx.getConnection().dispose();
                })
                .verifyComplete();
    }

    @Test
    public void testDatasourceDestroy_closesTunnelResourcesAndPool() throws Exception {
        ConnectionPool pool = mock(ConnectionPool.class);
        when(pool.disposeLater()).thenReturn(Mono.empty());

        ServerSocket serverSocket = mock(ServerSocket.class);
        SSHClient sshClient = mock(SSHClient.class);
        Thread forwarderThread = mock(Thread.class);
        SSHTunnelContext tunnelContext = new SSHTunnelContext(serverSocket, forwarderThread, sshClient);

        ConnectionContext<ConnectionPool> ctx = new ConnectionContext<>(pool, tunnelContext);

        pluginExecutor.datasourceDestroy(ctx);

        // Teardown happens asynchronously on a bounded-elastic scheduler, so verify with a timeout.
        verify(serverSocket, timeout(2000)).close();
        verify(sshClient, timeout(2000)).disconnect();
        verify(forwarderThread, timeout(2000)).interrupt();
        verify(pool, timeout(2000)).disposeLater();
    }

    @Test
    public void testExecuteParameterized_missingQuery_returnsErrorResult() {
        ConnectionPool pool = mock(ConnectionPool.class);
        ConnectionContext<ConnectionPool> ctx = new ConnectionContext<>(pool, null);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("");
        List<Property> templates = new ArrayList<>();
        templates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(templates);

        StepVerifier.create(pluginExecutor.executeParameterized(
                        ctx, new ExecuteActionDTO(), standardConfig(), actionConfiguration))
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());
                    assertNotNull(result.getPluginErrorDetails());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteParameterized_preparedStatement_runsThroughExecuteCommon() {
        ConnectionPool pool = mock(ConnectionPool.class);
        when(pool.create()).thenReturn(Mono.error(new R2dbcNonTransientResourceException("connection lost")));
        ConnectionContext<ConnectionPool> ctx = new ConnectionContext<>(pool, null);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT 1"); // default path treats this as a prepared statement

        // A dropped connection from the pool surfaces as a stale connection for prepared-statement execution.
        StepVerifier.create(pluginExecutor.executeParameterized(
                        ctx, new ExecuteActionDTO(), standardConfig(), actionConfiguration))
                .expectError(StaleConnectionException.class)
                .verify();
    }

    @Test
    public void testExecuteParameterized_nonPreparedStatement_runsThroughExecuteCommon() {
        ConnectionPool pool = mock(ConnectionPool.class);
        when(pool.create()).thenReturn(Mono.error(new R2dbcNonTransientResourceException("connection lost")));
        ConnectionContext<ConnectionPool> ctx = new ConnectionContext<>(pool, null);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT 1");
        List<Property> templates = new ArrayList<>();
        templates.add(new Property("preparedStatement", false));
        actionConfiguration.setPluginSpecifiedTemplates(templates);

        StepVerifier.create(pluginExecutor.executeParameterized(
                        ctx, new ExecuteActionDTO(), standardConfig(), actionConfiguration))
                .expectError(StaleConnectionException.class)
                .verify();
    }

    /**
     * getStructure must apply the same SSH-tunnel liveness gate as query execution: a dead tunnel (the DB connection
     * still validates locally, but the SSH client is disconnected) must surface as a StaleConnectionException so the
     * datasource context is recreated automatically.
     */
    @Test
    public void testGetStructure_deadSshTunnel_throwsStaleConnection() {
        ConnectionPool pool = mock(ConnectionPool.class);
        Connection connection = mock(Connection.class);
        when(pool.create()).thenReturn(Mono.just(connection));
        when(connection.validate(ValidationDepth.LOCAL)).thenReturn(Mono.just(true));
        when(connection.close()).thenReturn(Mono.empty());
        when(pool.getMetrics()).thenReturn(Optional.empty());
        // getStructure assembles `thenMany(Flux.from(connection.createStatement(KEYS_QUERY).execute()))` eagerly,
        // so the statement must be stubbed even though the stale error short-circuits before it is subscribed.
        Statement statement = mock(Statement.class);
        when(connection.createStatement(anyString())).thenReturn(statement);
        doReturn(Flux.empty()).when(statement).execute();

        SSHClient sshClient = mock(SSHClient.class);
        when(sshClient.isConnected()).thenReturn(false);
        SSHTunnelContext tunnelContext = new SSHTunnelContext(null, null, sshClient);

        ConnectionContext<ConnectionPool> ctx = new ConnectionContext<>(pool, tunnelContext);

        StepVerifier.create(pluginExecutor.getStructure(ctx, standardConfig()))
                .expectErrorSatisfies(error -> {
                    assertTrue(error instanceof StaleConnectionException);
                    assertEquals(CONNECTION_VALIDITY_CHECK_FAILED_ERROR_MSG, error.getMessage());
                })
                .verify();
    }
}
