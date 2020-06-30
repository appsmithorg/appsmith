package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.Connection;
import java.util.List;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

/**
 * Unit tests for the PostgresPlugin
 */
public class PostgresPluginTest {

    PostgresPlugin.PostgresPluginExecutor pluginExecutor = new PostgresPlugin.PostgresPluginExecutor();

    @ClassRule
    public static PostgreSQLContainer pgsqlContainer = new PostgreSQLContainer<>("postgres:alpine")
            .withExposedPorts(5432)
            .withUsername("postgres")
            .withPassword("password");

    String address;
    Integer port;
    String username, password;

    @Before
    public void setUp() {
        address = pgsqlContainer.getContainerIpAddress();
        port = pgsqlContainer.getFirstMappedPort();
        username = pgsqlContainer.getUsername();
        password = pgsqlContainer.getPassword();
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        AuthenticationDTO authDTO = new AuthenticationDTO();
        authDTO.setAuthType(AuthenticationDTO.Type.USERNAME_PASSWORD);
        authDTO.setUsername(username);
        authDTO.setPassword(password);
        authDTO.setDatabaseName("postgres");

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(address);
        endpoint.setPort(port.longValue());

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authDTO);
        dsConfig.setEndpoints(List.of(endpoint));
        return dsConfig;
    }

    @Test
    public void testConnectPostgresContainer() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        Mono<Object> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .assertNext(connection -> {
                    Connection conn = (Connection) connection;
                    assertNotNull(conn);
                })
                .verifyComplete();
    }

    @Test
    public void testExecute() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Object> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT datname FROM pg_database");

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                })
                .verifyComplete();
    }
}
