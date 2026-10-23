package com.external.plugins;

import com.appsmith.external.configurations.connectionpool.ConnectionPoolConfig;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.ConnectionContext;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.services.SharedConfig;
import com.zaxxer.hikari.HikariDataSource;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.DriverManager;
import java.sql.ResultSet;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeoutException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;

@Testcontainers
class PostgresQueryTimeoutCancelTest {

    private static final int ACTION_TIMEOUT_MS = 1000;

    @SuppressWarnings("rawtypes")
    @Container
    static final PostgreSQLContainer postgres = new PostgreSQLContainer<>("postgres:alpine")
            .withExposedPorts(5432)
            .withUsername("postgres")
            .withPassword("password");

    @Test
    void should_cancelQueryOnDatabase_when_timeoutFiresAndCancelEnabled() throws Exception {
        // Given
        PostgresPlugin.PostgresPluginExecutor executor = executor(true);
        DatasourceConfiguration datasourceConfiguration = datasourceConfiguration();
        ConnectionContext<HikariDataSource> connection =
                executor.datasourceCreate(datasourceConfiguration).block();
        String marker = "cancel_enabled_marker";

        // When
        runWithServerTimeout(executor, connection, datasourceConfiguration, marker);
        int activeQueries = activeQueriesAfterWaiting(marker);
        connection.getConnection().close();

        // Then
        assertThat(activeQueries).isZero();
    }

    @Test
    void should_leaveQueryRunningOnDatabase_when_timeoutFiresAndCancelDisabled() throws Exception {
        // Given
        PostgresPlugin.PostgresPluginExecutor executor = executor(false);
        DatasourceConfiguration datasourceConfiguration = datasourceConfiguration();
        ConnectionContext<HikariDataSource> connection =
                executor.datasourceCreate(datasourceConfiguration).block();
        String marker = "cancel_disabled_marker";

        // When
        runWithServerTimeout(executor, connection, datasourceConfiguration, marker);
        int activeQueries = activeQueriesAfterWaiting(marker);
        connection.getConnection().close();

        // Then
        assertThat(activeQueries).isEqualTo(1);
    }

    @Test
    void should_returnQueryTimeoutError_when_databaseCancelsQuery() {
        // Given
        PostgresPlugin.PostgresPluginExecutor executor = executor(true);
        DatasourceConfiguration datasourceConfiguration = datasourceConfiguration();
        ConnectionContext<HikariDataSource> connection =
                executor.datasourceCreate(datasourceConfiguration).block();

        // When
        Mono<ActionExecutionResult> result =
                execute(executor, connection, datasourceConfiguration, "timeout_error_marker");

        // Then
        StepVerifier.create(result)
                .assertNext(actionExecutionResult -> {
                    assertThat(actionExecutionResult.getIsExecutionSuccess()).isFalse();
                    assertThat(actionExecutionResult.getPluginErrorDetails().getAppsmithErrorCode())
                            .isEqualTo("PE-QRY-5000");
                    assertThat(actionExecutionResult.getPluginErrorDetails().getDownstreamErrorCode())
                            .isEqualTo("SQLSTATE: 57014");
                })
                .verifyComplete();
        connection.getConnection().close();
    }

    private static PostgresPlugin.PostgresPluginExecutor executor(boolean cancelEnabled) {
        SharedConfig sharedConfig = mock(SharedConfig.class);
        lenient().when(sharedConfig.getMaxResponseSize()).thenReturn(10_000);
        lenient().when(sharedConfig.isQueryTimeoutCancelEnabled()).thenReturn(cancelEnabled);
        ConnectionPoolConfig connectionPoolConfig = mock(ConnectionPoolConfig.class);
        lenient().when(connectionPoolConfig.getMaxConnectionPoolSize()).thenReturn(Mono.just(5));
        lenient().when(connectionPoolConfig.getSocketTimeoutSeconds()).thenReturn(Mono.just(600));
        return new PostgresPlugin.PostgresPluginExecutor(sharedConfig, connectionPoolConfig, ObservationRegistry.NOOP);
    }

    private static Mono<ActionExecutionResult> execute(
            PostgresPlugin.PostgresPluginExecutor executor,
            ConnectionContext<HikariDataSource> connection,
            DatasourceConfiguration datasourceConfiguration,
            String marker) {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT pg_sleep(30), '" + marker + "'");
        actionConfiguration.setTimeoutInMillisecond(String.valueOf(ACTION_TIMEOUT_MS));
        actionConfiguration.setPluginSpecifiedTemplates(List.of(new Property("preparedStatement", "false")));
        return executor.executeParameterized(
                connection, new ExecuteActionDTO(), datasourceConfiguration, actionConfiguration);
    }

    private static void runWithServerTimeout(
            PostgresPlugin.PostgresPluginExecutor executor,
            ConnectionContext<HikariDataSource> connection,
            DatasourceConfiguration datasourceConfiguration,
            String marker) {
        Mono<ActionExecutionResult> result = execute(executor, connection, datasourceConfiguration, marker)
                .timeout(Duration.ofMillis(ACTION_TIMEOUT_MS))
                .onErrorResume(TimeoutException.class, error -> Mono.empty());
        StepVerifier.create(result.then()).verifyComplete();
    }

    private static int activeQueriesAfterWaiting(String marker) throws Exception {
        try (java.sql.Connection connection =
                        DriverManager.getConnection(postgres.getJdbcUrl(), "postgres", "password");
                java.sql.Statement statement = connection.createStatement()) {
            statement.execute("SELECT pg_sleep(4)");
            try (ResultSet resultSet = statement.executeQuery(
                    "SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND query LIKE '%" + marker
                            + "%' AND pid <> pg_backend_pid()")) {
                resultSet.next();
                return resultSet.getInt(1);
            }
        }
    }

    private static DatasourceConfiguration datasourceConfiguration() {
        DBAuth auth = new DBAuth();
        auth.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        auth.setUsername(postgres.getUsername());
        auth.setPassword(postgres.getPassword());
        auth.setDatabaseName("postgres");

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(postgres.getHost());
        endpoint.setPort(postgres.getFirstMappedPort().longValue());

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(auth);
        datasourceConfiguration.setEndpoints(List.of(endpoint));
        datasourceConfiguration.setConnection(new Connection());
        datasourceConfiguration.getConnection().setSsl(new SSLDetails());
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);
        datasourceConfiguration.getConnection().setMode(Connection.Mode.READ_WRITE);
        return datasourceConfiguration;
    }
}
