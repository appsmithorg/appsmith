package com.external.plugins;

import com.appsmith.external.models.*;
import lombok.extern.log4j.Log4j;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.MySQLContainer;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.junit.Assert.*;

@Log4j
public class MySqlPluginTest {

    MySqlPlugin.MySqlPluginExecutor pluginExecutor = new MySqlPlugin.MySqlPluginExecutor();

    @ClassRule
    public static MySQLContainer mySQLContainer = new MySQLContainer()
            .withUsername("mysql").withPassword("password").withDatabaseName("mysql");

    String address;
    Integer port;
    String username, password;

    DatasourceConfiguration dsConfig;

    @Before
    public void setUp() {
        address = mySQLContainer.getContainerIpAddress();
        port = mySQLContainer.getFirstMappedPort();
        username = mySQLContainer.getUsername();
        password = mySQLContainer.getPassword();
        createDatasourceConfiguration();
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

        dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authDTO);
        dsConfig.setEndpoints(List.of(endpoint));
        return dsConfig;
    }

    @Test
    public void testConnectMySQLContainer() {

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
        Mono<Object> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("show databases");

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    System.out.println(result);
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                })
                .verifyComplete();
    }

    @Test
    public void testValidateDatasourceNullCredentials() {
        dsConfig.setConnection(new com.appsmith.external.models.Connection());
        dsConfig.getAuthentication().setUsername(null);
        dsConfig.getAuthentication().setPassword(null);
        dsConfig.getAuthentication().setDatabaseName("someDbName");
        Set<String> output = pluginExecutor.validateDatasource(dsConfig);
        assertTrue(output.contains("Missing username for authentication."));
        assertTrue(output.contains("Missing password for authentication."));
    }

    @Test
    public void testValidateDatasourceMissingDBName() {
        dsConfig.getAuthentication().setDatabaseName("");
        Set<String> output = pluginExecutor.validateDatasource(dsConfig);
        assertEquals(output.size(), 1);
        assertTrue(output.contains("Missing database name"));
    }

    @Test
    public void testValidateDatasourceNullEndpoint() {
        dsConfig.setEndpoints(null);
        Set<String> output = pluginExecutor.validateDatasource(dsConfig);
        assertEquals(output.size(), 1);
        assertTrue(output.contains("Missing endpoint and url"));
    }

    /* checking that the connection is being closed after the datadourceDestroy method is being called
    NOT : this test case will fail in case of a SQL Exception
     */
    @Test
    public void testDatasourceDestroy() {

        Mono<Object> connectionMono = pluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(connectionMono)
                .assertNext(connection -> {
                    java.sql.Connection conn = (Connection) connection;
                    pluginExecutor.datasourceDestroy(conn);
                    try {
                        assertEquals(conn.isClosed(), true);
                    } catch (SQLException e) {
                        e.printStackTrace();
                    }
                })
                .verifyComplete();

    }

}