package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

/**
 * Unit tests for the PostgresPlugin
 */
@Slf4j
public class PostgresPluginTest {

    PostgresPlugin.PostgresPluginExecutor pluginExecutor = new PostgresPlugin.PostgresPluginExecutor();

    @ClassRule
    public static final PostgreSQLContainer pgsqlContainer = new PostgreSQLContainer<>("postgres:alpine")
            .withExposedPorts(5432)
            .withUsername("postgres")
            .withPassword("password");

    String address;
    Integer port;
    String username, password;

    @Before
    public void setUp() {
        if (address != null) {
            return;
        }

        address = pgsqlContainer.getContainerIpAddress();
        port = pgsqlContainer.getFirstMappedPort();
        username = pgsqlContainer.getUsername();
        password = pgsqlContainer.getPassword();

        Properties properties = new Properties();
        properties.putAll(Map.of(
                "user", username,
                "password", password
        ));

        try (Connection connection = DriverManager.getConnection(
                "jdbc:postgresql://" + address + ":" + port + "/" + username,
                properties
        )) {

            try (Statement statement = connection.createStatement()) {
                statement.execute("SET TIME ZONE 'UTC'");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute("DROP TABLE IF EXISTS users");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE TABLE users(\n" +
                        "    id serial PRIMARY KEY,\n" +
                        "    username VARCHAR (50) UNIQUE NOT NULL,\n" +
                        "    password VARCHAR (50) NOT NULL,\n" +
                        "    email VARCHAR (355) UNIQUE NOT NULL,\n" +
                        "    spouse_dob DATE,\n" +
                        "    dob DATE NOT NULL,\n" +
                        "    time1 TIME NOT NULL,\n" +
                        "    time_tz TIME WITH TIME ZONE NOT NULL,\n" +
                        "    created_on TIMESTAMP NOT NULL,\n" +
                        "    created_on_tz TIMESTAMP WITH TIME ZONE NOT NULL,\n" +
                        "    interval1 INTERVAL HOUR NOT NULL\n" +
                        ")");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute(
                        "INSERT INTO users VALUES (" +
                                "1, 'Jack', 'jill', 'jack@exemplars.com', NULL, '2018-12-31'," +
                                " '18:32:45', '04:05:06 PST'," +
                                " TIMESTAMP '2018-11-30 20:45:15', TIMESTAMP WITH TIME ZONE '2018-11-30 20:45:15 CET'," +
                                " '1.2 years 3 months 2 hours'" +
                                ")");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute(
                        "INSERT INTO users VALUES (" +
                                "2, 'Jill', 'jack', 'jill@exemplars.com', NULL, '2019-12-31'," +
                                " '15:45:30', '04:05:06 PST'," +
                                " TIMESTAMP '2019-11-30 23:59:59', TIMESTAMP WITH TIME ZONE '2019-11-30 23:59:59 CET'," +
                                " '2 years'" +
                                ")");
            }

    } catch (SQLException throwables) {
            throwables.printStackTrace();
        }
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
        actionConfiguration.setBody("SELECT * FROM users WHERE id = 1");

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;

                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals("2018-12-31", node.get("dob").asText());
                    assertEquals("18:32:45", node.get("time1").asText());
                    assertEquals("04:05:06-08", node.get("time_tz").asText());
                    assertEquals("2018-11-30T20:45:15Z", node.get("created_on").asText());
                    assertEquals("2018-11-30T19:45:15Z", node.get("created_on_tz").asText());
                    assertEquals("1 years 5 mons 0 days 2 hours 0 mins 0.0 secs", node.get("interval1").asText());
                    assertTrue(node.get("spouse_dob").isNull());
                })
                .verifyComplete();
    }
}
