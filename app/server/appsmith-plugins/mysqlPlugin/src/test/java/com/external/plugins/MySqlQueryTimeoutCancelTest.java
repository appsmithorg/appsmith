package com.external.plugins;

import com.appsmith.external.configurations.connectionpool.ConnectionPoolConfig;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.ConnectionContext;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.services.SharedConfig;
import io.micrometer.observation.ObservationRegistry;
import io.r2dbc.pool.ConnectionPool;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeoutException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;

@Testcontainers
class MySqlQueryTimeoutCancelTest {

    private static final int ACTION_TIMEOUT_MS = 1000;

    @SuppressWarnings("rawtypes")
    @Container
    static final MySQLContainer mySQLContainer = new MySQLContainer(
                    DockerImageName.parse("mysql/mysql-server:8.0.25").asCompatibleSubstituteFor("mysql"))
            .withUsername("mysql")
            .withPassword("password")
            .withDatabaseName("test_db");

    @Test
    void should_stopQueryOnDatabase_when_timeoutFiresAndCancelEnabled() {
        // Given
        MySqlPlugin.MySqlPluginExecutor executor = executor(true);
        DatasourceConfiguration datasourceConfiguration = datasourceConfiguration();
        ConnectionContext<ConnectionPool> connection =
                executor.datasourceCreate(datasourceConfiguration).block();
        String marker = "cancel_enabled_marker";

        // When
        runWithServerTimeout(executor, connection, datasourceConfiguration, marker);
        long runningQueries = runningQueriesAfterWaiting(marker);
        connection.getConnection().dispose();

        // Then
        assertThat(runningQueries).isZero();
    }

    @Test
    void should_leaveQueryRunningOnDatabase_when_timeoutFiresAndCancelDisabled() {
        // Given
        MySqlPlugin.MySqlPluginExecutor executor = executor(false);
        DatasourceConfiguration datasourceConfiguration = datasourceConfiguration();
        ConnectionContext<ConnectionPool> connection =
                executor.datasourceCreate(datasourceConfiguration).block();
        String marker = "cancel_disabled_marker";

        // When
        runWithServerTimeout(executor, connection, datasourceConfiguration, marker);
        long runningQueries = runningQueriesAfterWaiting(marker);
        connection.getConnection().dispose();

        // Then
        assertThat(runningQueries).isEqualTo(1);
    }

    private static MySqlPlugin.MySqlPluginExecutor executor(boolean cancelEnabled) {
        SharedConfig sharedConfig = mock(SharedConfig.class);
        lenient().when(sharedConfig.isQueryTimeoutCancelEnabled()).thenReturn(cancelEnabled);
        ConnectionPoolConfig connectionPoolConfig = mock(ConnectionPoolConfig.class);
        lenient().when(connectionPoolConfig.getMaxConnectionPoolSize()).thenReturn(Mono.just(5));
        lenient().when(connectionPoolConfig.getSocketTimeoutSeconds()).thenReturn(Mono.just(600));
        return new MySqlPlugin.MySqlPluginExecutor(connectionPoolConfig, sharedConfig, ObservationRegistry.NOOP);
    }

    private static ActionConfiguration actionConfiguration(String body) {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(body);
        actionConfiguration.setTimeoutInMillisecond(String.valueOf(ACTION_TIMEOUT_MS));
        actionConfiguration.setPluginSpecifiedTemplates(List.of(new Property("preparedStatement", "false")));
        return actionConfiguration;
    }

    private static void runWithServerTimeout(
            MySqlPlugin.MySqlPluginExecutor executor,
            ConnectionContext<ConnectionPool> connection,
            DatasourceConfiguration datasourceConfiguration,
            String marker) {
        Mono<ActionExecutionResult> result = executor.executeParameterized(
                        connection,
                        new ExecuteActionDTO(),
                        datasourceConfiguration,
                        actionConfiguration("SELECT SLEEP(30), '" + marker + "'"))
                .timeout(Duration.ofMillis(ACTION_TIMEOUT_MS))
                .onErrorResume(TimeoutException.class, error -> Mono.empty());
        StepVerifier.create(result.then()).verifyComplete();
    }

    private static long runningQueriesAfterWaiting(String marker) {
        MySqlPlugin.MySqlPluginExecutor observer = executor(false);
        DatasourceConfiguration datasourceConfiguration = datasourceConfiguration();
        ConnectionContext<ConnectionPool> connection =
                observer.datasourceCreate(datasourceConfiguration).block();
        ActionConfiguration wait = actionConfiguration("SELECT SLEEP(4)");
        wait.setTimeoutInMillisecond("10000");
        ActionConfiguration count = actionConfiguration(
                "SELECT COUNT(*) AS running FROM information_schema.processlist WHERE command = 'Query' AND info LIKE '%"
                        + marker + "%' AND id <> CONNECTION_ID()");
        ActionExecutionResult result = observer.executeParameterized(
                        connection, new ExecuteActionDTO(), datasourceConfiguration, wait)
                .then(observer.executeParameterized(connection, new ExecuteActionDTO(), datasourceConfiguration, count))
                .block();
        connection.getConnection().dispose();
        return result.getBody() == null
                ? -1
                : ((com.fasterxml.jackson.databind.JsonNode) result.getBody())
                        .get(0)
                        .get("running")
                        .asLong();
    }

    private static DatasourceConfiguration datasourceConfiguration() {
        DBAuth auth = new DBAuth();
        auth.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        auth.setUsername(mySQLContainer.getUsername());
        auth.setPassword(mySQLContainer.getPassword());
        auth.setDatabaseName(mySQLContainer.getDatabaseName());

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(mySQLContainer.getHost());
        endpoint.setPort(mySQLContainer.getFirstMappedPort().longValue());

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(auth);
        datasourceConfiguration.setEndpoints(List.of(endpoint));
        datasourceConfiguration.setConnection(new com.appsmith.external.models.Connection());
        datasourceConfiguration.getConnection().setSsl(new SSLDetails());
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null);
        properties.add(new Property("Connection method", "Standard"));
        datasourceConfiguration.setProperties(properties);
        return datasourceConfiguration;
    }
}
