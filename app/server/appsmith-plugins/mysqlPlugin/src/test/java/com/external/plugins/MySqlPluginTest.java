package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Endpoint;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.log4j.Log4j;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.MySQLContainer;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

@Log4j
public class MySqlPluginTest {

    MySqlPlugin.MySqlPluginExecutor pluginExecutor = new MySqlPlugin.MySqlPluginExecutor();

    @SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is pseudo-optional.
    @ClassRule
    public static MySQLContainer mySQLContainer = new MySQLContainer()
            .withUsername("mysql")
            .withPassword("password")
            .withDatabaseName("test_db");

    String address;
    Integer port;
    String username;
    String password;
    String database;

    DatasourceConfiguration dsConfig;

    @Before
    public void setUp() {
        if (address != null) {
            return;
        }

        address = mySQLContainer.getContainerIpAddress();
        port = mySQLContainer.getFirstMappedPort();
        username = mySQLContainer.getUsername();
        password = mySQLContainer.getPassword();
        database = mySQLContainer.getDatabaseName();
        createDatasourceConfiguration();

        Properties properties = new Properties();
        properties.putAll(Map.of(
                "user", username,
                "password", password
        ));

        try (Connection connection = DriverManager.getConnection(
                "jdbc:mysql://" + address + ":" + port + "/" + database,
                properties
        )) {

            try (Statement statement = connection.createStatement()) {
                statement.execute("DROP TABLE IF EXISTS users");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute("create table users (\n" +
                        "    id int primary key,\n" +
                        "    username varchar (250) unique not null,\n" +
                        "    password varchar (250) not null,\n" +
                        "    email varchar (250) unique not null,\n" +
                        "    spouse_dob date,\n" +
                        "    dob date not null,\n" +
                        "    yob year not null,\n" +
                        "    time1 time not null,\n" +
                        "    created_on timestamp not null,\n" +
                        "    updated_on datetime not null,\n" +
                        "    constraint unique index (username, email)\n" +
                        ")");

                statement.execute("create table possessions (\n" +
                        "    id int primary key,\n" +
                        "    title varchar (250) not null,\n" +
                        "    user_id int not null,\n" +
                        "    username varchar (250) not null,\n" +
                        "    email varchar (250) not null\n" +
                        ")");

                statement.execute("alter table possessions add foreign key (username, email) references users (username, email)");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute(
                        "INSERT INTO users VALUES (" +
                                "1, 'Jack', 'jill', 'jack@exemplars.com', NULL, '2018-12-31', 2018," +
                                " '18:32:45'," +
                                " '2018-11-30 20:45:15', '2018-11-30 20:45:15'" +
                                ")");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute(
                        "INSERT INTO users VALUES (" +
                                "2, 'Jill', 'jack', 'jill@exemplars.com', NULL, '2019-12-31', 2019," +
                                " '15:45:30'," +
                                " '2019-11-30 23:59:59', '2019-11-30 23:59:59'" +
                                ")");
            }

        } catch (SQLException throwable) {
            throwable.printStackTrace();
        }
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        AuthenticationDTO authDTO = new AuthenticationDTO();
        authDTO.setAuthType(AuthenticationDTO.Type.USERNAME_PASSWORD);
        authDTO.setUsername(username);
        authDTO.setPassword(password);
        authDTO.setDatabaseName(database);

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

        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .assertNext(connection -> {
                    java.sql.Connection conn = (Connection) connection;
                    assertNotNull(conn);
                })
                .verifyComplete();
    }

    @Test
    public void testExecute() {
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

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

        Mono<Connection> connectionMono = pluginExecutor.datasourceCreate(dsConfig);

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
    public void testExecuteDataTypes() {
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
                    assertEquals("2018", node.get("yob").asText());
                    assertTrue(node.get("time1").asText().matches("\\d{2}:\\d{2}:\\d{2}"));
                    assertTrue(node.get("created_on").asText().matches("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z"));
                    assertTrue(node.get("updated_on").asText().matches("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z"));

                    assertArrayEquals(
                            new String[]{
                                    "id",
                                    "username",
                                    "password",
                                    "email",
                                    "spouse_dob",
                                    "dob",
                                    "yob",
                                    "time1",
                                    "created_on",
                                    "updated_on"
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
    public void testStructure() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<DatasourceStructure> structureMono = pluginExecutor.datasourceCreate(dsConfig)
                .flatMap(connection -> pluginExecutor.getStructure(connection, dsConfig));

        StepVerifier.create(structureMono)
                .assertNext(structure -> {
                    assertNotNull(structure);
                    assertEquals(2, structure.getTables().size());

                    final DatasourceStructure.Table possessionsTable = structure.getTables().get(0);
                    assertEquals("possessions", possessionsTable.getName());
                    assertEquals(DatasourceStructure.TableType.TABLE, possessionsTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[]{
                                    new DatasourceStructure.Column("id", "int", null),
                                    new DatasourceStructure.Column("title", "varchar", null),
                                    new DatasourceStructure.Column("user_id", "int", null),
                                    new DatasourceStructure.Column("username", "varchar", null),
                                    new DatasourceStructure.Column("email", "varchar", null),
                            },
                            possessionsTable.getColumns().toArray()
                    );

                    final DatasourceStructure.PrimaryKey possessionsPrimaryKey =
                            new DatasourceStructure.PrimaryKey("PRIMARY", List.of("id"));
                    final DatasourceStructure.ForeignKey possessionsUserForeignKey = new DatasourceStructure.ForeignKey(
                            "possessions_ibfk_1",
                            List.of("username", "email"),
                            List.of("users.username", "users.email")
                    );
                    assertArrayEquals(
                            new DatasourceStructure.Key[]{possessionsPrimaryKey, possessionsUserForeignKey},
                            possessionsTable.getKeys().toArray()
                    );

                    assertArrayEquals(
                            new DatasourceStructure.Template[]{
                                    new DatasourceStructure.Template("SELECT", "SELECT * FROM possessions LIMIT 10;"),
                                    new DatasourceStructure.Template("INSERT", "INSERT INTO possessions (id, title, user_id, username, email)\n" +
                                            "  VALUES (1, '', 1, '', '');"),
                                    new DatasourceStructure.Template("DELETE", "DELETE FROM possessions\n" +
                                            "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!"),
                            },
                            possessionsTable.getTemplates().toArray()
                    );

                    final DatasourceStructure.Table usersTable = structure.getTables().get(1);
                    assertEquals("users", usersTable.getName());
                    assertEquals(DatasourceStructure.TableType.TABLE, usersTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[]{
                                    new DatasourceStructure.Column("id", "int", null),
                                    new DatasourceStructure.Column("username", "varchar", null),
                                    new DatasourceStructure.Column("password", "varchar", null),
                                    new DatasourceStructure.Column("email", "varchar", null),
                                    new DatasourceStructure.Column("spouse_dob", "date", null),
                                    new DatasourceStructure.Column("dob", "date", null),
                                    new DatasourceStructure.Column("yob", "year", null),
                                    new DatasourceStructure.Column("time1", "time", null),
                                    new DatasourceStructure.Column("created_on", "timestamp", null),
                                    new DatasourceStructure.Column("updated_on", "datetime", null),
                            },
                            usersTable.getColumns().toArray()
                    );

                    final DatasourceStructure.PrimaryKey usersPrimaryKey = new DatasourceStructure.PrimaryKey("PRIMARY", List.of("id"));
                    assertArrayEquals(
                            new DatasourceStructure.Key[]{usersPrimaryKey},
                            usersTable.getKeys().toArray()
                    );

                    assertArrayEquals(
                            new DatasourceStructure.Template[]{
                                    new DatasourceStructure.Template("SELECT", "SELECT * FROM users LIMIT 10;"),
                                    new DatasourceStructure.Template("INSERT", "INSERT INTO users (id, username, password, email, spouse_dob, dob, yob, time1, created_on, updated_on)\n" +
                                            "  VALUES (1, '', '', '', '2019-07-01', '2019-07-01', '', '', '2019-07-01 10:00:00', '2019-07-01 10:00:00');"),
                                    new DatasourceStructure.Template("DELETE", "DELETE FROM users\n" +
                                            "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!"),
                            },
                            usersTable.getTemplates().toArray()
                    );
                })
                .verifyComplete();
    }

}
