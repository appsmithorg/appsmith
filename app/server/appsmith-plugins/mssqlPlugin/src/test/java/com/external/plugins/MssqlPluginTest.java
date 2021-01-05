package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.MSSQLServerContainer;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.List;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

/**
 * Unit tests for the PostgresPlugin
 */
@Slf4j
public class MssqlPluginTest {

    MssqlPlugin.MssqlPluginExecutor pluginExecutor = new MssqlPlugin.MssqlPluginExecutor();

    @SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is pseudo-optional.
    @ClassRule
    public static final MSSQLServerContainer container =
            new MSSQLServerContainer<>("mcr.microsoft.com/mssql/server:2017-latest")
                    .acceptLicense()
                    .withExposedPorts(1433)
                    .withPassword("Mssql123");

    private static String address;
    private static Integer port;
    private static String username, password;

    @BeforeClass
    public static void setUp() throws SQLException {
        address = container.getContainerIpAddress();
        port = container.getMappedPort(1433);
        username = container.getUsername();
        password = container.getPassword();

        try (Connection connection = DriverManager.getConnection(
                "jdbc:sqlserver://" + address + ":" + port + ";user=" + username + ";password=" + password
        )) {

            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE TABLE users (\n" +
                        "    id int identity (1, 1) NOT NULL,\n" +
                        "    username VARCHAR (50) UNIQUE NOT NULL,\n" +
                        "    password VARCHAR (50) NOT NULL,\n" +
                        "    email VARCHAR (355) UNIQUE NOT NULL,\n" +
                        "    spouse_dob DATE,\n" +
                        "    dob DATE NOT NULL,\n" +
                        "    time1 TIME NOT NULL,\n" +
                        "    constraint pk_users_id primary key (id)\n" +
                        ")");

                statement.execute("CREATE TABLE possessions (\n" +
                        "    id int identity (1, 1) not null,\n" +
                        "    title VARCHAR (50) NOT NULL,\n" +
                        "    user_id int NOT NULL,\n" +
                        "    constraint pk_possessions_id primary key (id),\n" +
                        "    constraint user_fk foreign key (user_id) references users(id)\n" +
                        ")");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute("SET identity_insert users ON;");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute(
                        "INSERT INTO users (id, username, password, email, spouse_dob, dob, time1) VALUES (" +
                                "1, 'Jack', 'jill', 'jack@exemplars.com', NULL, '2018-12-31'," +
                                " '18:32:45'" +
                                ")");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute(
                        "INSERT INTO users (id, username, password, email, spouse_dob, dob, time1) VALUES (" +
                                "2, 'Jill', 'jack', 'jill@exemplars.com', NULL, '2019-12-31'," +
                                " '15:45:30'" +
                                ")");
            }

        }
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        DBAuth authDTO = new DBAuth();
        authDTO.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authDTO.setUsername(username);
        authDTO.setPassword(password);

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(address);
        endpoint.setPort(port.longValue());

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authDTO);
        dsConfig.setEndpoints(List.of(endpoint));
        return dsConfig;
    }

    @Test
    public void testConnectMsSqlContainer() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .assertNext(Assert::assertNotNull)
                .verifyComplete();
    }

    @Test
    public void testAliasColumnNames() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT id as user_id FROM users WHERE id = 1");

        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertArrayEquals(
                            new String[]{
                                    "user_id"
                            },
                            new ObjectMapper()
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray()
                    );
                })
                .verifyComplete();
    }

    @Test
    public void testExecute() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT * FROM users WHERE id = 1");

        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals("2018-12-31", node.get("dob").asText());
                    assertEquals("18:32:45.0000000", node.get("time1").asText());
                    assertTrue(node.get("spouse_dob").isNull());

                    // Check the order of the columns.
                    assertArrayEquals(
                            new String[]{
                                    "id",
                                    "username",
                                    "password",
                                    "email",
                                    "spouse_dob",
                                    "dob",
                                    "time1",
                            },
                            new ObjectMapper()
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray()
                    );
                })
                .verifyComplete();
    }

    @Test
    public void invalidTestConnectMsSqlContainer() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        // Set up random username and password and try to connect
        DBAuth auth = (DBAuth) dsConfig.getAuthentication();
        auth.setUsername(new ObjectId().toString());
        auth.setPassword(new ObjectId().toString());

        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithPluginException)
                .verify();
    }

}
