package com.external.plugins;

import com.appsmith.external.models.*;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.MySQLContainer;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.junit.Assert.*;

public class MySqlPluginTest {

    MySqlPlugin.MySqlPluginExecutor pluginExecutor = new MySqlPlugin.MySqlPluginExecutor();

    @ClassRule
    public static MySQLContainer mySQLContainer = new MySQLContainer()
            .withUsername("mysql").withPassword("password").withDatabaseName("mysql");

    String address;
    Integer port;
    String username, password;

    @Before
    public void setUp() {
        address = mySQLContainer.getContainerIpAddress();
        port = mySQLContainer.getFirstMappedPort();
        username = mySQLContainer.getUsername();
        password = mySQLContainer.getPassword();
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        AuthenticationDTO authDTO = new AuthenticationDTO();
        authDTO.setAuthType(AuthenticationDTO.Type.USERNAME_PASSWORD);
        authDTO.setUsername(username);
        authDTO.setPassword(password);
        authDTO.setDatabaseName("mysql");

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(address);
        endpoint.setPort(port.longValue());

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authDTO);
        dsConfig.setEndpoints(List.of(endpoint));
        return dsConfig;
    }

    @Test
    public void testConnectMySQLContainer() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        Mono<Object> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .assertNext(connection -> {
                    java.sql.Connection conn = (Connection) connection;
                    assertNotNull(conn);
                })
                .verifyComplete();
    }

    @Test
    public void testExecute() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Object> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("show databases");

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

    @Test
    public void testValidateDataSource() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Set<String> output = null;

        dsConfig.getAuthentication().setDatabaseName("");
        output = pluginExecutor.validateDatasource(dsConfig);
        assertEquals(output.size(), 1);
        assertEquals(output.iterator().next(), "Having endpoints but missing DatabaseName");

        dsConfig.setEndpoints(null);
        output = pluginExecutor.validateDatasource(dsConfig);
        assertEquals(output.size(), 1);
        assertEquals(output.iterator().next(), "Missing endpoint and url");

        dsConfig.setConnection(new com.appsmith.external.models.Connection());
        dsConfig.getAuthentication().setUsername(null);
        dsConfig.getAuthentication().setPassword(null);
        output = pluginExecutor.validateDatasource(dsConfig);
        assertEquals(output.size(), 4);
    }

}