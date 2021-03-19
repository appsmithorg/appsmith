package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

/**
 * Unit tests for the PostgresPlugin
 */
public class PostgresPluginTest {

    PostgresPlugin.PostgresPluginExecutor pluginExecutor = new PostgresPlugin.PostgresPluginExecutor();

    @SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is pseudo-optional.
    @ClassRule
    public static final PostgreSQLContainer pgsqlContainer = new PostgreSQLContainer<>("postgres:alpine")
            .withExposedPorts(5432)
            .withUsername("postgres")
            .withPassword("password");

    private static String address;
    private static Integer port;
    private static String username, password;

    @BeforeClass
    public static void setUp() {
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
                statement.execute("CREATE TABLE users (\n" +
                        "    id serial PRIMARY KEY,\n" +
                        "    username VARCHAR (50) UNIQUE,\n" +
                        "    password VARCHAR (50) ,\n" +
                        "    email VARCHAR (355) UNIQUE ,\n" +
                        "    spouse_dob DATE,\n" +
                        "    dob DATE ,\n" +
                        "    time1 TIME ,\n" +
                        "    time_tz TIME WITH TIME ZONE ,\n" +
                        "    created_on TIMESTAMP ,\n" +
                        "    created_on_tz TIMESTAMP WITH TIME ZONE ,\n" +
                        "    interval1 INTERVAL HOUR ,\n" +
                        "    numbers INTEGER[3] ,\n" +
                        "    texts VARCHAR[2] \n" +
                        ")");

                statement.execute("CREATE TABLE possessions (\n" +
                        "    id serial PRIMARY KEY,\n" +
                        "    title VARCHAR (50) NOT NULL,\n" +
                        "    user_id int NOT NULL,\n" +
                        "    constraint user_fk foreign key (user_id) references users(id)" +
                        ")");

                // Testing <https://github.com/appsmithorg/appsmith/issues/1758>.
                statement.execute("CREATE TABLE campus (\n" +
                        "    id timestamptz default now(),\n" +
                        "    name timestamptz default now()\n" +
                        ")");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute(
                        "INSERT INTO users VALUES (" +
                                "1, 'Jack', 'jill', 'jack@exemplars.com', NULL, '2018-12-31'," +
                                " '18:32:45', '04:05:06 PST'," +
                                " TIMESTAMP '2018-11-30 20:45:15', TIMESTAMP WITH TIME ZONE '2018-11-30 20:45:15 CET'," +
                                " '1.2 years 3 months 2 hours'," +
                                " '{1, 2, 3}', '{\"a\", \"b\"}'" +
                                ")");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute(
                        "INSERT INTO users VALUES (" +
                                "2, 'Jill', 'jack', 'jill@exemplars.com', NULL, '2019-12-31'," +
                                " '15:45:30', '04:05:06 PST'," +
                                " TIMESTAMP '2019-11-30 23:59:59', TIMESTAMP WITH TIME ZONE '2019-11-30 23:59:59 CET'," +
                                " '2 years'," +
                                " '{1, 2, 3}', '{\"a\", \"b\"}'" +
                                ")");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute(
                        "INSERT INTO users VALUES (" +
                                "3, 'MiniJackJill', 'jaji', 'jaji@exemplars.com', NULL, '2021-01-31'," +
                                " '15:45:30', '04:05:06 PST'," +
                                " TIMESTAMP '2021-01-31 23:59:59', TIMESTAMP WITH TIME ZONE '2021-01-31 23:59:59 CET'," +
                                " '0 years'," +
                                " '{1, 2, 3}', '{\"a\", \"b\"}'" +
                                ")");
            }

        } catch (SQLException throwable) {
            throwable.printStackTrace();
        }
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        DBAuth authDTO = new DBAuth();
        authDTO.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authDTO.setUsername(username);
        authDTO.setPassword(password);
        authDTO.setDatabaseName("postgres");

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(address);
        endpoint.setPort(port.longValue());

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authDTO);
        dsConfig.setEndpoints(List.of(endpoint));

        /* set ssl mode and read/write mode */
        dsConfig.setConnection(new com.appsmith.external.models.Connection());
        dsConfig.getConnection().setSsl(new SSLDetails());
        dsConfig.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);
        dsConfig.getConnection().setMode(com.appsmith.external.models.Connection.Mode.READ_ONLY);

        return dsConfig;
    }

    @Test
    public void testConnectPostgresContainer() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        Mono<HikariDataSource> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .assertNext(Assert::assertNotNull)
                .verifyComplete();
    }

    @Test
    public void itShouldValidateDatasourceWithEmptyEndpoints() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.setEndpoints(new ArrayList<>());

        Assert.assertEquals(Set.of("Missing endpoint."),
                pluginExecutor.validateDatasource(dsConfig));
    }

    @Test
    public void itShouldValidateDatasourceWithEmptyHost() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getEndpoints().get(0).setHost("");

        Assert.assertEquals(Set.of("Missing hostname."),
                pluginExecutor.validateDatasource(dsConfig));
    }

    @Test
    public void itShouldValidateDatasourceWithInvalidHostname() {

        String hostname = "jdbc://localhost";
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getEndpoints().get(0).setHost("jdbc://localhost");

        Assert.assertEquals(Set.of("Host value cannot contain `/` or `:` characters. Found `" + hostname + "`."),
                pluginExecutor.validateDatasource(dsConfig));
    }

    @Test
    public void testAliasColumnNames() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<HikariDataSource> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT id as user_id FROM users WHERE id = 1");
        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "false"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

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
        Mono<HikariDataSource> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT * FROM users WHERE id = 1");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "false"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
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
                                    "time_tz",
                                    "created_on",
                                    "created_on_tz",
                                    "interval1",
                                    "numbers",
                                    "texts",
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
                    assertEquals(3, structure.getTables().size());

                    final DatasourceStructure.Table campusTable = structure.getTables().get(0);
                    assertEquals("public.campus", campusTable.getName());
                    assertEquals(DatasourceStructure.TableType.TABLE, campusTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[]{
                                    new DatasourceStructure.Column("id", "timestamptz", "now()"),
                                    new DatasourceStructure.Column("name", "timestamptz", "now()")
                            },
                            campusTable.getColumns().toArray()
                    );
                    assertEquals(campusTable.getKeys().size(), 0);

                    final DatasourceStructure.Table possessionsTable = structure.getTables().get(1);
                    assertEquals("public.possessions", possessionsTable.getName());
                    assertEquals(DatasourceStructure.TableType.TABLE, possessionsTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[]{
                                    new DatasourceStructure.Column("id", "int4", "nextval('possessions_id_seq'::regclass)"),
                                    new DatasourceStructure.Column("title", "varchar", null),
                                    new DatasourceStructure.Column("user_id", "int4", null),
                            },
                            possessionsTable.getColumns().toArray()
                    );

                    final DatasourceStructure.PrimaryKey possessionsPrimaryKey = new DatasourceStructure.PrimaryKey("possessions_pkey", new ArrayList<>());
                    possessionsPrimaryKey.getColumnNames().add("id");
                    final DatasourceStructure.ForeignKey possessionsUserForeignKey = new DatasourceStructure.ForeignKey(
                            "user_fk",
                            List.of("user_id"),
                            List.of("users.id")
                    );
                    assertArrayEquals(
                            new DatasourceStructure.Key[]{possessionsPrimaryKey, possessionsUserForeignKey},
                            possessionsTable.getKeys().toArray()
                    );

                    assertArrayEquals(
                            new DatasourceStructure.Template[]{
                                    new DatasourceStructure.Template("SELECT", "SELECT * FROM public.\"possessions\" LIMIT 10;"),
                                    new DatasourceStructure.Template("INSERT", "INSERT INTO public.\"possessions\" (\"title\", \"user_id\")\n" +
                                            "  VALUES ('', 1);"),
                                    new DatasourceStructure.Template("UPDATE", "UPDATE public.\"possessions\" SET\n" +
                                            "    \"title\" = ''\n" +
                                            "    \"user_id\" = 1\n" +
                                            "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!"),
                                    new DatasourceStructure.Template("DELETE", "DELETE FROM public.\"possessions\"\n" +
                                            "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!"),
                            },
                            possessionsTable.getTemplates().toArray()
                    );

                    final DatasourceStructure.Table usersTable = structure.getTables().get(2);
                    assertEquals("public.users", usersTable.getName());
                    assertEquals(DatasourceStructure.TableType.TABLE, usersTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[]{
                                    new DatasourceStructure.Column("id", "int4", "nextval('users_id_seq'::regclass)"),
                                    new DatasourceStructure.Column("username", "varchar", null),
                                    new DatasourceStructure.Column("password", "varchar", null),
                                    new DatasourceStructure.Column("email", "varchar", null),
                                    new DatasourceStructure.Column("spouse_dob", "date", null),
                                    new DatasourceStructure.Column("dob", "date", null),
                                    new DatasourceStructure.Column("time1", "time", null),
                                    new DatasourceStructure.Column("time_tz", "timetz", null),
                                    new DatasourceStructure.Column("created_on", "timestamp", null),
                                    new DatasourceStructure.Column("created_on_tz", "timestamptz", null),
                                    new DatasourceStructure.Column("interval1", "interval", null),
                                    new DatasourceStructure.Column("numbers", "_int4", null),
                                    new DatasourceStructure.Column("texts", "_varchar", null),
                            },
                            usersTable.getColumns().toArray()
                    );

                    final DatasourceStructure.PrimaryKey usersPrimaryKey = new DatasourceStructure.PrimaryKey("users_pkey", new ArrayList<>());
                    usersPrimaryKey.getColumnNames().add("id");
                    assertArrayEquals(
                            new DatasourceStructure.Key[]{usersPrimaryKey},
                            usersTable.getKeys().toArray()
                    );

                    assertArrayEquals(
                            new DatasourceStructure.Template[]{
                                    new DatasourceStructure.Template("SELECT", "SELECT * FROM public.\"users\" LIMIT 10;"),
                                    new DatasourceStructure.Template("INSERT", "INSERT INTO public.\"users\" (\"username\", \"password\", \"email\", \"spouse_dob\", \"dob\", \"time1\", \"time_tz\", \"created_on\", \"created_on_tz\", \"interval1\", \"numbers\", \"texts\")\n" +
                                            "  VALUES ('', '', '', '2019-07-01', '2019-07-01', '18:32:45', '04:05:06 PST', TIMESTAMP '2019-07-01 10:00:00', TIMESTAMP WITH TIME ZONE '2019-07-01 06:30:00 CET', 1, '{1, 2, 3}', '{\"first\", \"second\"}');"),
                                    new DatasourceStructure.Template("UPDATE", "UPDATE public.\"users\" SET\n" +
                                            "    \"username\" = ''\n" +
                                            "    \"password\" = ''\n" +
                                            "    \"email\" = ''\n" +
                                            "    \"spouse_dob\" = '2019-07-01'\n" +
                                            "    \"dob\" = '2019-07-01'\n" +
                                            "    \"time1\" = '18:32:45'\n" +
                                            "    \"time_tz\" = '04:05:06 PST'\n" +
                                            "    \"created_on\" = TIMESTAMP '2019-07-01 10:00:00'\n" +
                                            "    \"created_on_tz\" = TIMESTAMP WITH TIME ZONE '2019-07-01 06:30:00 CET'\n" +
                                            "    \"interval1\" = 1\n" +
                                            "    \"numbers\" = '{1, 2, 3}'\n" +
                                            "    \"texts\" = '{\"first\", \"second\"}'\n" +
                                            "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!"),
                                    new DatasourceStructure.Template("DELETE", "DELETE FROM public.\"users\"\n" +
                                            "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!"),
                            },
                            usersTable.getTemplates().toArray()
                    );
                })
                .verifyComplete();
    }

    @Test
    public void testStaleConnectionCheck() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("show databases");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "false"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        Mono<HikariDataSource> connectionCreateMono = pluginExecutor.datasourceCreate(dsConfig);

        Mono<ActionExecutionResult> resultMono = connectionCreateMono
                .flatMap(pool -> {
                    pool.close();
                    return pluginExecutor.executeParameterized(pool, new ExecuteActionDTO(), dsConfig, actionConfiguration);
                });

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof StaleConnectionException)
                .verify();
    }

    @Test
    public void testPreparedStatementWithoutQuotes() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        // First test with the binding not surrounded with quotes
        actionConfiguration.setBody("SELECT * FROM public.\"users\" where id = {{binding1}};");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param = new Param();
        param.setKey("binding1");
        param.setValue("1");
        params.add(param);
        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono = pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono
                .flatMap(pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {

                    assertTrue(result.getIsExecutionSuccess());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals("2018-12-31", node.get("dob").asText());
                    assertEquals("18:32:45", node.get("time1").asText());
                    assertEquals("04:05:06-08", node.get("time_tz").asText());
                    assertEquals("2018-11-30T20:45:15Z", node.get("created_on").asText());
                    assertEquals("2018-11-30T19:45:15Z", node.get("created_on_tz").asText());
                    assertEquals("1 years 5 mons 0 days 2 hours 0 mins 0.0 secs", node.get("interval1").asText());
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
                                    "time_tz",
                                    "created_on",
                                    "created_on_tz",
                                    "interval1",
                                    "numbers",
                                    "texts",
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
    public void testPreparedStatementWithDoubleQuotes() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT * FROM public.\"users\" where id = \"{{binding1}}\";");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param = new Param();
        param.setKey("binding1");
        param.setValue("1");
        params.add(param);
        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono = pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono
                .flatMap(pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {

                    assertTrue(result.getIsExecutionSuccess());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals("2018-12-31", node.get("dob").asText());
                    assertEquals("18:32:45", node.get("time1").asText());
                    assertEquals("04:05:06-08", node.get("time_tz").asText());
                    assertEquals("2018-11-30T20:45:15Z", node.get("created_on").asText());
                    assertEquals("2018-11-30T19:45:15Z", node.get("created_on_tz").asText());
                    assertEquals("1 years 5 mons 0 days 2 hours 0 mins 0.0 secs", node.get("interval1").asText());
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
                                    "time_tz",
                                    "created_on",
                                    "created_on_tz",
                                    "interval1",
                                    "numbers",
                                    "texts",
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
    public void testPreparedStatementWithSingleQuotes() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT * FROM public.\"users\" where id = '{{binding1}}';");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param = new Param();
        param.setKey("binding1");
        param.setValue("1");
        params.add(param);
        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono = pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono
                .flatMap(pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {

                    assertTrue(result.getIsExecutionSuccess());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals("2018-12-31", node.get("dob").asText());
                    assertEquals("18:32:45", node.get("time1").asText());
                    assertEquals("04:05:06-08", node.get("time_tz").asText());
                    assertEquals("2018-11-30T20:45:15Z", node.get("created_on").asText());
                    assertEquals("2018-11-30T19:45:15Z", node.get("created_on_tz").asText());
                    assertEquals("1 years 5 mons 0 days 2 hours 0 mins 0.0 secs", node.get("interval1").asText());
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
                                    "time_tz",
                                    "created_on",
                                    "created_on_tz",
                                    "interval1",
                                    "numbers",
                                    "texts",
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
    public void testPreparedStatementWithNullStringValue() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("UPDATE public.\"users\" set " +
                "username = {{binding1}}, " +
                "password = {{binding1}},\n" +
                "email = {{binding1}},\n" +
                "spouse_dob = {{binding1}},\n" +
                "dob = {{binding1}},\n" +
                "time1 = {{binding1}},\n" +
                "time_tz = {{binding1}},\n" +
                "created_on = {{binding1}},\n" +
                "created_on_tz = {{binding1}},\n" +
                "interval1 = {{binding1}},\n" +
                "numbers = {{binding1}},\n" +
                "texts = {{binding1}}" +
                "  where id = 2;");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param = new Param();
        param.setKey("binding1");
        param.setValue("null");
        params.add(param);
        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono = pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono
                .flatMap(pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();

        actionConfiguration.setBody("SELECT * FROM public.\"users\" where id = 2;");
        resultMono = connectionCreateMono
                .flatMap(pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertTrue(node.get("dob").isNull());
                    assertTrue(node.get("time1").isNull());
                    assertTrue(node.get("time_tz").isNull());
                    assertTrue(node.get("created_on").isNull());
                    assertTrue(node.get("created_on_tz").isNull());
                    assertTrue(node.get("interval1").isNull());
                    assertTrue(node.get("spouse_dob").isNull());
                    assertTrue(node.get("username").isNull());
                })
                .verifyComplete();
    }

    @Test
    public void testPreparedStatementWithNullValue() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("UPDATE public.\"users\" set " +
                "username = {{binding1}}, " +
                "password = {{binding1}},\n" +
                "email = {{binding1}},\n" +
                "spouse_dob = {{binding1}},\n" +
                "dob = {{binding1}},\n" +
                "time1 = {{binding1}},\n" +
                "time_tz = {{binding1}},\n" +
                "created_on = {{binding1}},\n" +
                "created_on_tz = {{binding1}},\n" +
                "interval1 = {{binding1}},\n" +
                "numbers = {{binding1}},\n" +
                "texts = {{binding1}}" +
                "  where id = 3;");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param = new Param();
        param.setKey("binding1");
        param.setValue(null);
        params.add(param);
        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono = pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono
                .flatMap(pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();

        actionConfiguration.setBody("SELECT * FROM public.\"users\" where id = 3;");
        resultMono = connectionCreateMono
                .flatMap(pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertTrue(node.get("dob").isNull());
                    assertTrue(node.get("time1").isNull());
                    assertTrue(node.get("time_tz").isNull());
                    assertTrue(node.get("created_on").isNull());
                    assertTrue(node.get("created_on_tz").isNull());
                    assertTrue(node.get("interval1").isNull());
                    assertTrue(node.get("spouse_dob").isNull());
                    assertTrue(node.get("username").isNull());
                })
                .verifyComplete();
    }

    @Test
    public void testSslToggleMissingError() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getConnection().getSsl().setAuthType(null);

        Mono<Set<String>> invalidsMono = Mono.just(pluginExecutor)
                .map(executor -> executor.validateDatasource(datasourceConfiguration));


        StepVerifier.create(invalidsMono)
                .assertNext(invalids -> {
                    String expectedError = "Appsmith server has failed to fetch SSL configuration from datasource " +
                            "configuration form. Please reach out to Appsmith customer support to resolve this.";
                    assertTrue(invalids
                            .stream()
                            .anyMatch(error -> expectedError.equals(error))
                    );
                })
                .verifyComplete();
    }

    @Test
    public void testSslDefault() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select * from pg_stat_ssl");

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);
        Mono<HikariDataSource> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig,
                        actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    String body = result.getBody().toString();
                    assertTrue(body.contains("\"ssl\":false"));
                })
                .verifyComplete();
    }

    @Test
    public void testSslDisable() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select * from pg_stat_ssl");

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DISABLE);
        Mono<HikariDataSource> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig,
                        actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    String body = result.getBody().toString();
                    assertTrue(body.contains("\"ssl\":false"));
                })
                .verifyComplete();
    }

    @Test
    public void testSslRequire() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("show session status like 'Ssl_cipher'");

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getConnection().getSsl().setAuthType(SSLDetails.AuthType.REQUIRE);
        Mono<HikariDataSource> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig,
                        actionConfiguration));
        StepVerifier.create(executeMono)
                .verifyErrorSatisfies(error -> {
                    /*
                     * - This error message indicates that the client was trying to establish an SSL connection but
                     *   could not because the testcontainer server does not have SSL enabled.
                     */
                    assertTrue(error.getMessage().contains("The server does not support SSL"));
                });
    }
}
