package com.external.plugins;

import com.appsmith.external.configurations.connectionpool.ConnectionPoolConfig;
import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.PsParameterDTO;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.SSHConnection;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.services.SharedConfig;
import com.external.plugins.exceptions.PostgresErrorMessages;
import com.external.plugins.exceptions.PostgresPluginError;
import com.fasterxml.jackson.core.StreamReadFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeType;
import com.fasterxml.jackson.databind.node.NullNode;
import com.zaxxer.hikari.HikariDataSource;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
public class PostgresPluginTest {

    public class MockSharedConfig implements SharedConfig {

        @Override
        public int getCodecSize() {
            return 10 * 1024 * 1024;
        }

        @Override
        public int getMaxResponseSize() {
            return 10000;
        }

        @Override
        public String getRemoteExecutionUrl() {
            return "";
        }
    }

    public class MockConnectionPoolConfig implements ConnectionPoolConfig {
        @Override
        public Mono<Integer> getMaxConnectionPoolSize() {
            return Mono.just(5);
        }
    }

    PostgresPlugin.PostgresPluginExecutor pluginExecutor =
            new PostgresPlugin.PostgresPluginExecutor(new MockSharedConfig(), new MockConnectionPoolConfig());

    @SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is pseudo-optional.
    @Container
    public static final PostgreSQLContainer pgsqlContainer = new PostgreSQLContainer<>("postgres:alpine")
            .withExposedPorts(5432)
            .withUsername("postgres")
            .withPassword("password");

    @Container
    public static final PostgreSQLContainer pgsqlContainerNoPwdAuth = new PostgreSQLContainer<>("postgres:alpine")
            .withExposedPorts(5432)
            .withUsername("postgres_no_pwd_auth")
            .withEnv("POSTGRES_HOST_AUTH_METHOD", "trust");

    private static String address;
    private static Integer port;
    private static String username, password;
    private static String addressNoPwdAuth;
    private static String usernameNoPwdAuth;
    private static Integer portNoPwdAuth;

    @BeforeAll
    public static void setUp() {
        if (address != null) {
            return;
        }

        address = pgsqlContainer.getContainerIpAddress();
        port = pgsqlContainer.getFirstMappedPort();
        username = pgsqlContainer.getUsername();
        password = pgsqlContainer.getPassword();

        addressNoPwdAuth = pgsqlContainerNoPwdAuth.getContainerIpAddress();
        usernameNoPwdAuth = pgsqlContainerNoPwdAuth.getUsername();
        portNoPwdAuth = pgsqlContainerNoPwdAuth.getFirstMappedPort();

        Properties properties = new Properties();
        properties.putAll(Map.of(
                "user", username,
                "password", password));

        try (Connection connection =
                DriverManager.getConnection("jdbc:postgresql://" + address + ":" + port + "/" + username, properties)) {

            try (Statement statement = connection.createStatement()) {
                statement.execute("SET TIME ZONE 'UTC'");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute("DROP TABLE IF EXISTS users");
            }

            /**
             * - Add citext module
             * - https://www.postgresql.org/docs/current/citext.html
             */
            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE EXTENSION CITEXT;");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE TABLE users (\n" + "    id serial PRIMARY KEY,\n"
                        + "    username VARCHAR (50) UNIQUE,\n"
                        + "    password VARCHAR (50) ,\n"
                        + "    email VARCHAR (355) UNIQUE ,\n"
                        + "    spouse_dob DATE,\n"
                        + "    dob DATE ,\n"
                        + "    time1 TIME ,\n"
                        + "    time_tz TIME WITH TIME ZONE ,\n"
                        + "    created_on TIMESTAMP ,\n"
                        + "    created_on_tz TIMESTAMP WITH TIME ZONE ,\n"
                        + "    interval1 INTERVAL HOUR ,\n"
                        + "    numbers INTEGER[3] ,\n"
                        + "    texts VARCHAR[2] ,\n"
                        + "    rating FLOAT4 \n"
                        + ")");

                statement.execute("CREATE TABLE possessions (\n" + "    id serial PRIMARY KEY,\n"
                        + "    title VARCHAR (50) NOT NULL,\n"
                        + "    user_id int NOT NULL,\n"
                        + "    constraint user_fk foreign key (user_id) references users(id)"
                        + ")");

                // Testing <https://github.com/appsmithorg/appsmith/issues/1758>.
                statement.execute("CREATE TABLE campus (\n" + "    id timestamptz default now(),\n"
                        + "    name timestamptz default now()\n"
                        + ")");

                statement.execute("CREATE TABLE dataTypeTest (\n" + "    id serial PRIMARY KEY,\n"
                        + "    item json,\n"
                        + "    origin jsonb,\n"
                        + "    citextdata citext"
                        + ")");

                statement.execute("CREATE SCHEMA sample_schema " + " CREATE TABLE sample_table (\n"
                        + "    id serial PRIMARY KEY,\n"
                        + "    username VARCHAR (50) UNIQUE,\n"
                        + "    email VARCHAR (355) UNIQUE ,\n"
                        + "    numbers INTEGER[3] ,\n"
                        + "    texts VARCHAR[2] ,\n"
                        + "    rating FLOAT4 \n"
                        + ")");

                statement.execute("CREATE TABLE \"testing-table-data\" (\n"
                        + "    id serial PRIMARY KEY,\n"
                        + "    name VARCHAR,\n"
                        + "    age INTEGER,\n"
                        + "    email VARCHAR (255) UNIQUE,\n"
                        + "    join_date DATE,\n"
                        + "    salary FLOAT4\n"
                        + ")");
                statement.execute("CREATE TABLE \"table_name-123\" (\n"
                        + "    id serial PRIMARY KEY,\n"
                        + "    name VARCHAR,\n"
                        + "    age INTEGER,\n"
                        + "    email VARCHAR (255) UNIQUE,\n"
                        + "    join_date DATE,\n"
                        + "    salary FLOAT4\n"
                        + ")");
                statement.execute("CREATE TABLE \"table-name.with.dots\" (\n"
                        + "    id serial PRIMARY KEY,\n"
                        + "    name VARCHAR,\n"
                        + "    age INTEGER,\n"
                        + "    email VARCHAR (255) UNIQUE,\n"
                        + "    join_date DATE,\n"
                        + "    salary FLOAT4\n"
                        + ")");

                statement.execute("CREATE TABLE \"table@name#special$chars\" (\n"
                        + "    id serial PRIMARY KEY,\n"
                        + "    name VARCHAR,\n"
                        + "    age INTEGER,\n"
                        + "    email VARCHAR (255) UNIQUE,\n"
                        + "    join_date DATE,\n"
                        + "    salary FLOAT4\n"
                        + ")");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute(
                        "INSERT INTO users VALUES (" + "1, 'Jack', 'jill', 'jack@exemplars.com', NULL, '2018-12-31',"
                                + " '18:32:45', '04:05:06 PST',"
                                + " TIMESTAMP '2018-11-30 20:45:15', TIMESTAMP WITH TIME ZONE '2018-11-30 20:45:15 CET',"
                                + " '1.2 years 3 months 2 hours',"
                                + " '{1, 2, 3}', '{\"a\", \"b\"}', 1.0"
                                + ")");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute(
                        "INSERT INTO sample_schema.\"sample_table\" VALUES (" + "1, 'Jack', 'jack@exemplars.com', "
                                + " '{1, 2, 3}', '{\"a\", \"b\"}', 1.0"
                                + ")");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute(
                        "INSERT INTO users VALUES (" + "2, 'Jill', 'jack', 'jill@exemplars.com', NULL, '2019-12-31',"
                                + " '15:45:30', '04:05:06 PST',"
                                + " TIMESTAMP '2019-11-30 23:59:59', TIMESTAMP WITH TIME ZONE '2019-11-30 23:59:59 CET',"
                                + " '2 years',"
                                + " '{1, 2, 3}', '{\"a\", \"b\"}', 2.0"
                                + ")");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute("INSERT INTO users VALUES ("
                        + "3, 'MiniJackJill', 'jaji', 'jaji@exemplars.com', NULL, '2021-01-31',"
                        + " '15:45:30', '04:05:06 PST',"
                        + " TIMESTAMP '2021-01-31 23:59:59', TIMESTAMP WITH TIME ZONE '2021-01-31 23:59:59 CET',"
                        + " '0 years',"
                        + " '{1, 2, 3}', '{\"a\", \"b\"}', 3.0"
                        + ")");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute("INSERT INTO dataTypeTest VALUES ("
                        + "1, '{\"type\":\"racket\", \"manufacturer\":\"butterfly\"}',"
                        + "'{\"country\":\"japan\", \"city\":\"kyoto\"}', 'A Lincoln'"
                        + ")");
            }
            try (Statement statement = connection.createStatement()) {
                statement.execute(
                        "INSERT INTO \"testing-table-data\" VALUES (" + " 1, '', 30, '', '2023-07-31', 75000.00" + ")");
            }
            try (Statement statement = connection.createStatement()) {
                statement.execute("INSERT INTO \"table_name-123\" VALUES ("
                        + " 1, 'John Doe', 30, 'john.doe@example.com', '2023-07-31', 75000.00" + ")");
            }
            try (Statement statement = connection.createStatement()) {
                statement.execute("INSERT INTO \"table-name.with.dots\" VALUES ("
                        + " 1, 'Jane Doe', 28, 'jane.doe@example.com', '2023-08-01', 65000.00" + ")");
            }
            try (Statement statement = connection.createStatement()) {
                statement.execute("INSERT INTO \"table@name#special$chars\" VALUES ("
                        + " 1, 'Alice Smith', 35, 'alice.smith@example.com', '2023-08-15', 80000.00" + ")");
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
        dsConfig.getConnection().setMode(com.appsmith.external.models.Connection.Mode.READ_WRITE);

        return dsConfig;
    }

    private DatasourceConfiguration createDatasourceConfigurationWithoutPwd() {
        DBAuth authDTO = new DBAuth();
        authDTO.setUsername(usernameNoPwdAuth);
        authDTO.setDatabaseName("postgres");

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(addressNoPwdAuth);
        endpoint.setPort(portNoPwdAuth.longValue());

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authDTO);
        dsConfig.setEndpoints(List.of(endpoint));

        /* set ssl mode and read/write mode */
        dsConfig.setConnection(new com.appsmith.external.models.Connection());
        dsConfig.getConnection().setSsl(new SSLDetails());
        dsConfig.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);
        dsConfig.getConnection().setMode(com.appsmith.external.models.Connection.Mode.READ_WRITE);

        return dsConfig;
    }

    private DatasourceStructure.Table findTableByName(List<DatasourceStructure.Table> tables, String tableToBeFound) {
        DatasourceStructure.Table tableFound = null;
        for (DatasourceStructure.Table table : tables) {
            if (table.getName().equals(tableToBeFound)) {
                tableFound = table;
                break;
            }
        }
        return tableFound;
    }

    @Test
    public void testStructure_containing_special_chars() throws SQLException {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<DatasourceStructure> structureMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .flatMap(connection -> pluginExecutor.getStructure(connection, dsConfig));

        StepVerifier.create(structureMono)
                .assertNext(structure -> {
                    assertNotNull(structure);
                    DatasourceStructure.Table sampleTable =
                            findTableByName(structure.getTables(), "public.table@name#special$chars");
                    assertNotNull(sampleTable);
                    assertEquals(DatasourceStructure.TableType.TABLE, sampleTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[] {
                                new DatasourceStructure.Column(
                                        "id", "int4", "nextval('\"table@name#special$chars_id_seq\"'::regclass)", true),
                                new DatasourceStructure.Column("name", "varchar", null, false),
                                new DatasourceStructure.Column("age", "int4", null, false),
                                new DatasourceStructure.Column("email", "varchar", null, false),
                                new DatasourceStructure.Column("join_date", "date", null, false),
                                new DatasourceStructure.Column("salary", "float4", null, false),
                            },
                            sampleTable.getColumns().toArray());

                    final DatasourceStructure.PrimaryKey samplePrimaryKey =
                            new DatasourceStructure.PrimaryKey("table@name#special$chars_pkey", new ArrayList<>());
                    samplePrimaryKey.getColumnNames().add("id");
                    assertArrayEquals(
                            new DatasourceStructure.Key[] {samplePrimaryKey},
                            sampleTable.getKeys().toArray());

                    assertArrayEquals(
                            new DatasourceStructure.Template[] {
                                new DatasourceStructure.Template(
                                        "SELECT", "SELECT * FROM public.\"table@name#special$chars\" LIMIT 10;", true),
                                new DatasourceStructure.Template(
                                        "INSERT",
                                        "INSERT INTO public.\"table@name#special$chars\" "
                                                + "(\"name\", \"age\", \"email\", \"join_date\", \"salary\")\n  "
                                                + "VALUES ('', 1, '', '2019-07-01', 1.0);",
                                        false),
                                new DatasourceStructure.Template(
                                        "UPDATE",
                                        "UPDATE public.\"table@name#special$chars\" SET\n"
                                                + "    \"name\" = '',\n"
                                                + "    \"age\" = 1,\n"
                                                + "    \"email\" = '',\n"
                                                + "    \"join_date\" = '2019-07-01',\n"
                                                + "    \"salary\" = 1.0\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!",
                                        false),
                                new DatasourceStructure.Template(
                                        "DELETE",
                                        "DELETE FROM public.\"table@name#special$chars\"\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!",
                                        false),
                            },
                            sampleTable.getTemplates().toArray());
                })
                .verifyComplete();
    }

    @Test
    public void testStructure_containing_underscore_and_hyphen() throws SQLException {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<DatasourceStructure> structureMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .flatMap(connection -> pluginExecutor.getStructure(connection, dsConfig));

        StepVerifier.create(structureMono)
                .assertNext(structure -> {
                    assertNotNull(structure);
                    DatasourceStructure.Table sampleTable =
                            findTableByName(structure.getTables(), "public.table_name-123");
                    assertNotNull(sampleTable);
                    assertEquals(DatasourceStructure.TableType.TABLE, sampleTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[] {
                                new DatasourceStructure.Column(
                                        "id", "int4", "nextval('\"table_name-123_id_seq\"'::regclass)", true),
                                new DatasourceStructure.Column("name", "varchar", null, false),
                                new DatasourceStructure.Column("age", "int4", null, false),
                                new DatasourceStructure.Column("email", "varchar", null, false),
                                new DatasourceStructure.Column("join_date", "date", null, false),
                                new DatasourceStructure.Column("salary", "float4", null, false),
                            },
                            sampleTable.getColumns().toArray());

                    final DatasourceStructure.PrimaryKey samplePrimaryKey =
                            new DatasourceStructure.PrimaryKey("table_name-123_pkey", new ArrayList<>());
                    samplePrimaryKey.getColumnNames().add("id");
                    assertArrayEquals(
                            new DatasourceStructure.Key[] {samplePrimaryKey},
                            sampleTable.getKeys().toArray());

                    assertArrayEquals(
                            new DatasourceStructure.Template[] {
                                new DatasourceStructure.Template(
                                        "SELECT", "SELECT * FROM public.\"table_name-123\" LIMIT 10;", true),
                                new DatasourceStructure.Template(
                                        "INSERT",
                                        "INSERT INTO public.\"table_name-123\" "
                                                + "(\"name\", \"age\", \"email\", \"join_date\", \"salary\")\n  "
                                                + "VALUES ('', 1, '', '2019-07-01', 1.0);",
                                        false),
                                new DatasourceStructure.Template(
                                        "UPDATE",
                                        "UPDATE public.\"table_name-123\" SET\n"
                                                + "    \"name\" = '',\n"
                                                + "    \"age\" = 1,\n"
                                                + "    \"email\" = '',\n"
                                                + "    \"join_date\" = '2019-07-01',\n"
                                                + "    \"salary\" = 1.0\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!",
                                        false),
                                new DatasourceStructure.Template(
                                        "DELETE",
                                        "DELETE FROM public.\"table_name-123\"\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!",
                                        false),
                            },
                            sampleTable.getTemplates().toArray());
                })
                .verifyComplete();
    }

    @Test
    public void testStructure_containing_dots() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<DatasourceStructure> structureMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .flatMap(connection -> pluginExecutor.getStructure(connection, dsConfig));

        StepVerifier.create(structureMono)
                .assertNext(structure -> {
                    assertNotNull(structure);
                    DatasourceStructure.Table sampleTable =
                            findTableByName(structure.getTables(), "public.table-name.with.dots");
                    assertNotNull(sampleTable);
                    assertEquals(DatasourceStructure.TableType.TABLE, sampleTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[] {
                                new DatasourceStructure.Column(
                                        "id", "int4", "nextval('\"table-name.with.dots_id_seq\"'::regclass)", true),
                                new DatasourceStructure.Column("name", "varchar", null, false),
                                new DatasourceStructure.Column("age", "int4", null, false),
                                new DatasourceStructure.Column("email", "varchar", null, false),
                                new DatasourceStructure.Column("join_date", "date", null, false),
                                new DatasourceStructure.Column("salary", "float4", null, false),
                            },
                            sampleTable.getColumns().toArray());

                    final DatasourceStructure.PrimaryKey samplePrimaryKey =
                            new DatasourceStructure.PrimaryKey("table-name.with.dots_pkey", new ArrayList<>());
                    samplePrimaryKey.getColumnNames().add("id");
                    assertArrayEquals(
                            new DatasourceStructure.Key[] {samplePrimaryKey},
                            sampleTable.getKeys().toArray());

                    assertArrayEquals(
                            new DatasourceStructure.Template[] {
                                new DatasourceStructure.Template(
                                        "SELECT", "SELECT * FROM public.\"table-name.with.dots\" LIMIT 10;", true),
                                new DatasourceStructure.Template(
                                        "INSERT",
                                        "INSERT INTO public.\"table-name.with.dots\" "
                                                + "(\"name\", \"age\", \"email\", \"join_date\", \"salary\")\n  "
                                                + "VALUES ('', 1, '', '2019-07-01', 1.0);",
                                        false),
                                new DatasourceStructure.Template(
                                        "UPDATE",
                                        "UPDATE public.\"table-name.with.dots\" SET\n"
                                                + "    \"name\" = '',\n"
                                                + "    \"age\" = 1,\n"
                                                + "    \"email\" = '',\n"
                                                + "    \"join_date\" = '2019-07-01',\n"
                                                + "    \"salary\" = 1.0\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!",
                                        false),
                                new DatasourceStructure.Template(
                                        "DELETE",
                                        "DELETE FROM public.\"table-name.with.dots\"\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!",
                                        false),
                            },
                            sampleTable.getTemplates().toArray());
                })
                .verifyComplete();
    }

    @Test
    public void testConnectPostgresContainer() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        Mono<HikariDataSource> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .assertNext(value -> {
                    Assertions.assertThat(value).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    public void testTestDatasource_withCorrectCredentials_returnsWithoutInvalids() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        final Mono<DatasourceTestResult> testDatasourceMono = pluginExecutor.testDatasource(dsConfig);

        StepVerifier.create(testDatasourceMono)
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                    assertTrue(datasourceTestResult.isSuccess());
                    assertTrue(datasourceTestResult.getInvalids().isEmpty());
                })
                .verifyComplete();
    }

    @Test
    public void validateDatasource_withCorrectCredentialsNoPwd_returnsWithoutInvalids() {
        DatasourceConfiguration dsConfig = createDatasourceConfigurationWithoutPwd();

        final Set<String> datasourceValidationInvalids = pluginExecutor.validateDatasource(dsConfig);

        assertEquals(Set.of("Missing password for authentication."), datasourceValidationInvalids);
    }

    @Test
    public void itShouldValidateDatasourceWithEmptyEndpoints() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.setEndpoints(new ArrayList<>());

        assertEquals(Set.of("Missing endpoint."), pluginExecutor.validateDatasource(dsConfig));
    }

    @Test
    public void itShouldValidateDatasourceWithEmptyHost() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getEndpoints().get(0).setHost("");

        assertEquals(Set.of("Missing hostname."), pluginExecutor.validateDatasource(dsConfig));
    }

    @Test
    public void itShouldValidateDatasourceWithInvalidHostname() {

        String hostname = "jdbc://localhost";
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getEndpoints().get(0).setHost("jdbc://localhost");

        assertEquals(
                Set.of(String.format(PostgresErrorMessages.DS_INVALID_HOSTNAME_ERROR_MSG, hostname)),
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

        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertArrayEquals(
                            new String[] {"user_id"},
                            new ObjectMapper()
                                    .enable(StreamReadFeature.INCLUDE_SOURCE_IN_LOCATION.mappedFeature())
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray());
                })
                .verifyComplete();
    }

    @Test
    public void testApplicationName() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<HikariDataSource> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(
                "SELECT COUNT(*) FROM pg_stat_activity WHERE application_name='Appsmith JDBC Driver';");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "false"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertTrue(node.get("count").asInt() > 0);
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

        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

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
                    assertEquals(
                            "2018-11-30T19:45:15Z", node.get("created_on_tz").asText());
                    assertEquals(
                            "1 years 5 mons 0 days 2 hours 0 mins 0.0 secs",
                            node.get("interval1").asText());
                    Assertions.assertThat(node.get("spouse_dob")).isEqualTo(NullNode.getInstance());

                    // Check the order of the columns.
                    assertArrayEquals(
                            new String[] {
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
                                "rating"
                            },
                            new ObjectMapper()
                                    .enable(StreamReadFeature.INCLUDE_SOURCE_IN_LOCATION.mappedFeature())
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray());

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(
                            ACTION_CONFIGURATION_BODY, actionConfiguration.getBody(), null, null, null));
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testStructure() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<DatasourceStructure> structureMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .flatMap(connection -> pluginExecutor.getStructure(connection, dsConfig));

        StepVerifier.create(structureMono)
                .assertNext(structure -> {
                    assertNotNull(structure);
                    assertEquals(9, structure.getTables().size());

                    DatasourceStructure.Table campusTable = findTableByName(structure.getTables(), "public.campus");
                    assertNotNull(campusTable);
                    assertEquals(DatasourceStructure.TableType.TABLE, campusTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[] {
                                new DatasourceStructure.Column("id", "timestamptz", "now()", false),
                                new DatasourceStructure.Column("name", "timestamptz", "now()", false)
                            },
                            campusTable.getColumns().toArray());
                    assertEquals(campusTable.getKeys().size(), 0);

                    DatasourceStructure.Table dataTypeTestTable =
                            findTableByName(structure.getTables(), "public.datatypetest");
                    assertNotNull(dataTypeTestTable);
                    assertEquals(DatasourceStructure.TableType.TABLE, campusTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[] {
                                new DatasourceStructure.Column(
                                        "id", "int4", "nextval('datatypetest_id_seq'::regclass)", true),
                                new DatasourceStructure.Column("item", "json", null, false),
                                new DatasourceStructure.Column("origin", "jsonb", null, false),
                                new DatasourceStructure.Column("citextdata", "citext", null, false)
                            },
                            dataTypeTestTable.getColumns().toArray());
                    assertEquals(dataTypeTestTable.getKeys().size(), 1);

                    DatasourceStructure.Table possessionsTable =
                            findTableByName(structure.getTables(), "public.possessions");
                    assertNotNull(possessionsTable);
                    assertEquals(DatasourceStructure.TableType.TABLE, possessionsTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[] {
                                new DatasourceStructure.Column(
                                        "id", "int4", "nextval('possessions_id_seq'::regclass)", true),
                                new DatasourceStructure.Column("title", "varchar", null, false),
                                new DatasourceStructure.Column("user_id", "int4", null, false),
                            },
                            possessionsTable.getColumns().toArray());

                    final DatasourceStructure.PrimaryKey possessionsPrimaryKey =
                            new DatasourceStructure.PrimaryKey("possessions_pkey", new ArrayList<>());
                    possessionsPrimaryKey.getColumnNames().add("id");
                    final DatasourceStructure.ForeignKey possessionsUserForeignKey =
                            new DatasourceStructure.ForeignKey("user_fk", List.of("user_id"), List.of("users.id"));
                    assertArrayEquals(
                            new DatasourceStructure.Key[] {possessionsPrimaryKey, possessionsUserForeignKey},
                            possessionsTable.getKeys().toArray());

                    assertArrayEquals(
                            new DatasourceStructure.Template[] {
                                new DatasourceStructure.Template(
                                        "SELECT", "SELECT * FROM public.\"possessions\" LIMIT 10;", true),
                                new DatasourceStructure.Template(
                                        "INSERT",
                                        "INSERT INTO public.\"possessions\" (\"title\", \"user_id\")\n"
                                                + "  VALUES ('', 1);",
                                        false),
                                new DatasourceStructure.Template(
                                        "UPDATE",
                                        "UPDATE public.\"possessions\" SET\n" + "    \"title\" = '',\n"
                                                + "    \"user_id\" = 1\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!",
                                        false),
                                new DatasourceStructure.Template(
                                        "DELETE",
                                        "DELETE FROM public.\"possessions\"\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!",
                                        false),
                            },
                            possessionsTable.getTemplates().toArray());

                    DatasourceStructure.Table usersTable = findTableByName(structure.getTables(), "public.users");
                    assertNotNull(usersTable);
                    assertEquals(DatasourceStructure.TableType.TABLE, usersTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[] {
                                new DatasourceStructure.Column("id", "int4", "nextval('users_id_seq'::regclass)", true),
                                new DatasourceStructure.Column("username", "varchar", null, false),
                                new DatasourceStructure.Column("password", "varchar", null, false),
                                new DatasourceStructure.Column("email", "varchar", null, false),
                                new DatasourceStructure.Column("spouse_dob", "date", null, false),
                                new DatasourceStructure.Column("dob", "date", null, false),
                                new DatasourceStructure.Column("time1", "time", null, false),
                                new DatasourceStructure.Column("time_tz", "timetz", null, false),
                                new DatasourceStructure.Column("created_on", "timestamp", null, false),
                                new DatasourceStructure.Column("created_on_tz", "timestamptz", null, false),
                                new DatasourceStructure.Column("interval1", "interval", null, false),
                                new DatasourceStructure.Column("numbers", "_int4", null, false),
                                new DatasourceStructure.Column("texts", "_varchar", null, false),
                                new DatasourceStructure.Column("rating", "float4", null, false),
                            },
                            usersTable.getColumns().toArray());

                    final DatasourceStructure.PrimaryKey usersPrimaryKey =
                            new DatasourceStructure.PrimaryKey("users_pkey", new ArrayList<>());
                    usersPrimaryKey.getColumnNames().add("id");
                    assertArrayEquals(
                            new DatasourceStructure.Key[] {usersPrimaryKey},
                            usersTable.getKeys().toArray());

                    assertArrayEquals(
                            new DatasourceStructure.Template[] {
                                new DatasourceStructure.Template(
                                        "SELECT", "SELECT * FROM public.\"users\" LIMIT 10;", true),
                                new DatasourceStructure.Template(
                                        "INSERT",
                                        "INSERT INTO public.\"users\" "
                                                + "(\"username\", \"password\", \"email\", \"spouse_dob\", \"dob\", "
                                                + "\"time1\", \"time_tz\", \"created_on\", \"created_on_tz\", "
                                                + "\"interval1\", \"numbers\", \"texts\", \"rating\")\n  "
                                                + "VALUES ('', '', '', '2019-07-01', '2019-07-01', '18:32:45', "
                                                + "'04:05:06 PST', TIMESTAMP '2019-07-01 10:00:00', TIMESTAMP WITH TIME ZONE "
                                                + "'2019-07-01 06:30:00 CET', 1, '{1, 2, 3}', '{\"first\", \"second\"}', 1.0);",
                                        false),
                                new DatasourceStructure.Template(
                                        "UPDATE",
                                        "UPDATE public.\"users\" SET\n" + "    \"username\" = '',\n"
                                                + "    \"password\" = '',\n"
                                                + "    \"email\" = '',\n"
                                                + "    \"spouse_dob\" = '2019-07-01',\n"
                                                + "    \"dob\" = '2019-07-01',\n"
                                                + "    \"time1\" = '18:32:45',\n"
                                                + "    \"time_tz\" = '04:05:06 PST',\n"
                                                + "    \"created_on\" = TIMESTAMP '2019-07-01 10:00:00',\n"
                                                + "    \"created_on_tz\" = TIMESTAMP WITH TIME ZONE '2019-07-01 06:30:00 CET',\n"
                                                + "    \"interval1\" = 1,\n"
                                                + "    \"numbers\" = '{1, 2, 3}',\n"
                                                + "    \"texts\" = '{\"first\", \"second\"}',\n"
                                                + "    \"rating\" = 1.0\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!",
                                        false),
                                new DatasourceStructure.Template(
                                        "DELETE",
                                        "DELETE FROM public.\"users\"\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!",
                                        false),
                            },
                            usersTable.getTemplates().toArray());

                    DatasourceStructure.Table sampleTable =
                            findTableByName(structure.getTables(), "sample_schema.sample_table");
                    assertNotNull(sampleTable);
                    assertEquals("sample_schema", sampleTable.getSchema());
                    assertEquals(DatasourceStructure.TableType.TABLE, sampleTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[] {
                                new DatasourceStructure.Column(
                                        "id", "int4", "nextval('sample_schema.sample_table_id_seq'::regclass)", true),
                                new DatasourceStructure.Column("username", "varchar", null, false),
                                new DatasourceStructure.Column("email", "varchar", null, false),
                                new DatasourceStructure.Column("numbers", "_int4", null, false),
                                new DatasourceStructure.Column("texts", "_varchar", null, false),
                                new DatasourceStructure.Column("rating", "float4", null, false),
                            },
                            sampleTable.getColumns().toArray());

                    final DatasourceStructure.PrimaryKey samplePrimaryKey =
                            new DatasourceStructure.PrimaryKey("sample_table_pkey", new ArrayList<>());
                    samplePrimaryKey.getColumnNames().add("id");
                    assertArrayEquals(
                            new DatasourceStructure.Key[] {samplePrimaryKey},
                            sampleTable.getKeys().toArray());

                    assertArrayEquals(
                            new DatasourceStructure.Template[] {
                                new DatasourceStructure.Template(
                                        "SELECT", "SELECT * FROM sample_schema.\"sample_table\" LIMIT 10;", true),
                                new DatasourceStructure.Template(
                                        "INSERT",
                                        "INSERT INTO sample_schema.\"sample_table\" "
                                                + "(\"username\", \"email\", \"numbers\", \"texts\", \"rating\")\n  "
                                                + "VALUES ('', '', '{1, 2, 3}', '{\"first\", \"second\"}', 1.0);",
                                        false),
                                new DatasourceStructure.Template(
                                        "UPDATE",
                                        "UPDATE sample_schema.\"sample_table\" SET\n" + "    \"username\" = '',\n"
                                                + "    \"email\" = '',\n"
                                                + "    \"numbers\" = '{1, 2, 3}',\n"
                                                + "    \"texts\" = '{\"first\", \"second\"}',\n"
                                                + "    \"rating\" = 1.0\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!",
                                        false),
                                new DatasourceStructure.Template(
                                        "DELETE",
                                        "DELETE FROM sample_schema.\"sample_table\"\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!",
                                        false),
                            },
                            sampleTable.getTemplates().toArray());
                })
                .verifyComplete();
    }

    @Test
    public void testStructure_containing_hyphen() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<DatasourceStructure> structureMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .flatMap(connection -> pluginExecutor.getStructure(connection, dsConfig));

        StepVerifier.create(structureMono)
                .assertNext(structure -> {
                    assertNotNull(structure);
                    assertEquals(9, structure.getTables().size());

                    DatasourceStructure.Table sampleTable =
                            findTableByName(structure.getTables(), "public.testing-table-data");
                    assertNotNull(sampleTable);
                    assertEquals(DatasourceStructure.TableType.TABLE, sampleTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[] {
                                new DatasourceStructure.Column(
                                        "id", "int4", "nextval('\"testing-table-data_id_seq\"'::regclass)", true),
                                new DatasourceStructure.Column("name", "varchar", null, false),
                                new DatasourceStructure.Column("age", "int4", null, false),
                                new DatasourceStructure.Column("email", "varchar", null, false),
                                new DatasourceStructure.Column("join_date", "date", null, false),
                                new DatasourceStructure.Column("salary", "float4", null, false),
                            },
                            sampleTable.getColumns().toArray());

                    final DatasourceStructure.PrimaryKey samplePrimaryKey =
                            new DatasourceStructure.PrimaryKey("testing-table-data_pkey", new ArrayList<>());
                    samplePrimaryKey.getColumnNames().add("id");
                    assertArrayEquals(
                            new DatasourceStructure.Key[] {samplePrimaryKey},
                            sampleTable.getKeys().toArray());

                    assertArrayEquals(
                            new DatasourceStructure.Template[] {
                                new DatasourceStructure.Template(
                                        "SELECT", "SELECT * FROM public.\"testing-table-data\" LIMIT 10;", true),
                                new DatasourceStructure.Template(
                                        "INSERT",
                                        "INSERT INTO public.\"testing-table-data\" "
                                                + "(\"name\", \"age\", \"email\", \"join_date\", \"salary\")\n  "
                                                + "VALUES ('', 1, '', '2019-07-01', 1.0);",
                                        false),
                                new DatasourceStructure.Template(
                                        "UPDATE",
                                        "UPDATE public.\"testing-table-data\" SET\n"
                                                + "    \"name\" = '',\n"
                                                + "    \"age\" = 1,\n"
                                                + "    \"email\" = '',\n"
                                                + "    \"join_date\" = '2019-07-01',\n"
                                                + "    \"salary\" = 1.0\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!",
                                        false),
                                new DatasourceStructure.Template(
                                        "DELETE",
                                        "DELETE FROM public.\"testing-table-data\"\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!",
                                        false),
                            },
                            sampleTable.getTemplates().toArray());
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

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(pool -> {
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
        param.setClientDataType(ClientDataType.NUMBER);

        params.add(param);
        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono =
                pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(
                pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals("2018-12-31", node.get("dob").asText());
                    assertEquals("18:32:45", node.get("time1").asText());
                    assertEquals("04:05:06-08", node.get("time_tz").asText());
                    assertEquals("2018-11-30T20:45:15Z", node.get("created_on").asText());
                    assertEquals(
                            "2018-11-30T19:45:15Z", node.get("created_on_tz").asText());
                    assertEquals(
                            "1 years 5 mons 0 days 2 hours 0 mins 0.0 secs",
                            node.get("interval1").asText());
                    assertTrue(node.get("spouse_dob").isNull());
                    assertEquals(1.0, node.get("rating").asDouble(), 0.0);

                    // Check the order of the columns.
                    assertArrayEquals(
                            new String[] {
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
                                "rating"
                            },
                            new ObjectMapper()
                                    .enable(StreamReadFeature.INCLUDE_SOURCE_IN_LOCATION.mappedFeature())
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray());

                    // Assert the debug request parameters are getting set.
                    ActionExecutionRequest request = result.getRequest();
                    List<Map.Entry<String, String>> parameters = (List<Map.Entry<String, String>>)
                            request.getProperties().get("ps-parameters");
                    assertEquals(parameters.size(), 1);
                    Map.Entry<String, String> parameterEntry = parameters.get(0);
                    assertEquals(parameterEntry.getKey(), "1");
                    assertEquals(parameterEntry.getValue(), "INTEGER");
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
        param.setClientDataType(ClientDataType.NUMBER);
        params.add(param);
        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono =
                pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(
                pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals("2018-12-31", node.get("dob").asText());
                    assertEquals("18:32:45", node.get("time1").asText());
                    assertEquals("04:05:06-08", node.get("time_tz").asText());
                    assertEquals("2018-11-30T20:45:15Z", node.get("created_on").asText());
                    assertEquals(
                            "2018-11-30T19:45:15Z", node.get("created_on_tz").asText());
                    assertEquals(
                            "1 years 5 mons 0 days 2 hours 0 mins 0.0 secs",
                            node.get("interval1").asText());
                    assertTrue(node.get("spouse_dob").isNull());

                    // Check the order of the columns.
                    assertArrayEquals(
                            new String[] {
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
                                "rating"
                            },
                            new ObjectMapper()
                                    .enable(StreamReadFeature.INCLUDE_SOURCE_IN_LOCATION.mappedFeature())
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray());

                    /*
                     * - Check if request params are sent back properly.
                     * - Not replicating the same to other tests as the overall flow remainst the same w.r.t. request
                     *  params.
                     */

                    // check if '?' is replaced by $i.
                    assertEquals(
                            "SELECT * FROM public.\"users\" where id = $1;",
                            ((RequestParamDTO) (((List) result.getRequest().getRequestParams())).get(0)).getValue());

                    PsParameterDTO expectedPsParam = new PsParameterDTO("1", "INTEGER");
                    PsParameterDTO returnedPsParam = (PsParameterDTO)
                            ((RequestParamDTO) (((List) result.getRequest().getRequestParams())).get(0))
                                    .getSubstitutedParams()
                                    .get("$1");
                    // Check if prepared stmt param value is correctly sent back.
                    assertEquals(expectedPsParam.getValue(), returnedPsParam.getValue());
                    // check if prepared stmt param type is correctly sent back.
                    assertEquals(expectedPsParam.getType(), returnedPsParam.getType());
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
        param.setClientDataType(ClientDataType.NUMBER);
        params.add(param);
        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono =
                pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(
                pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals("2018-12-31", node.get("dob").asText());
                    assertEquals("18:32:45", node.get("time1").asText());
                    assertEquals("04:05:06-08", node.get("time_tz").asText());
                    assertEquals("2018-11-30T20:45:15Z", node.get("created_on").asText());
                    assertEquals(
                            "2018-11-30T19:45:15Z", node.get("created_on_tz").asText());
                    assertEquals(
                            "1 years 5 mons 0 days 2 hours 0 mins 0.0 secs",
                            node.get("interval1").asText());
                    assertTrue(node.get("spouse_dob").isNull());

                    // Check the order of the columns.
                    assertArrayEquals(
                            new String[] {
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
                                "rating"
                            },
                            new ObjectMapper()
                                    .enable(StreamReadFeature.INCLUDE_SOURCE_IN_LOCATION.mappedFeature())
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray());
                })
                .verifyComplete();
    }

    @Test
    public void testPreparedStatementWithNullStringValue() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("UPDATE public.\"users\" set " + "username = {{binding1}}, "
                + "password = {{binding1}},\n"
                + "email = {{binding1}},\n"
                + "spouse_dob = {{binding1}},\n"
                + "dob = {{binding1}},\n"
                + "time1 = {{binding1}},\n"
                + "time_tz = {{binding1}},\n"
                + "created_on = {{binding1}},\n"
                + "created_on_tz = {{binding1}},\n"
                + "interval1 = {{binding1}},\n"
                + "numbers = {{binding1}},\n"
                + "texts = {{binding1}}"
                + "  where id = 2;");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param = new Param();
        param.setKey("binding1");
        param.setValue("null");
        param.setClientDataType(ClientDataType.NULL);
        params.add(param);
        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono =
                pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(
                pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();

        actionConfiguration.setBody("SELECT * FROM public.\"users\" where id = 2;");
        resultMono = connectionCreateMono.flatMap(
                pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

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
        actionConfiguration.setBody("UPDATE public.\"users\" set " + "username = {{binding1}}, "
                + "password = {{binding1}},\n"
                + "email = {{binding1}},\n"
                + "spouse_dob = {{binding1}},\n"
                + "dob = {{binding1}},\n"
                + "time1 = {{binding1}},\n"
                + "time_tz = {{binding1}},\n"
                + "created_on = {{binding1}},\n"
                + "created_on_tz = {{binding1}},\n"
                + "interval1 = {{binding1}},\n"
                + "numbers = {{binding1}},\n"
                + "texts = {{binding1}}"
                + "  where id = 3;");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param = new Param();
        param.setKey("binding1");
        param.setValue(null);
        param.setClientDataType(ClientDataType.NULL);
        params.add(param);
        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono =
                pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(
                pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();

        actionConfiguration.setBody("SELECT * FROM public.\"users\" where id = 3;");
        resultMono = connectionCreateMono.flatMap(
                pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

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

        Mono<Set<String>> invalidsMono =
                Mono.just(pluginExecutor).map(executor -> executor.validateDatasource(datasourceConfiguration));

        StepVerifier.create(invalidsMono)
                .assertNext(invalids -> {
                    assertTrue(invalids.stream()
                            .anyMatch(error -> PostgresErrorMessages.SSL_CONFIGURATION_ERROR_MSG.equals(error)));
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
        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
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
        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
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
        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono).verifyErrorSatisfies(error -> {
            /*
             * - This error message indicates that the client was trying to establish an SSL connection but
             *   could not because the testcontainer server does not have SSL enabled.
             */
            assertTrue(((AppsmithPluginException) error)
                    .getDownstreamErrorMessage()
                    .contains("The server does not support SSL"));
        });
    }

    @Test
    public void testSslPrefer() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select * from pg_stat_ssl");

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getConnection().getSsl().setAuthType(SSLDetails.AuthType.PREFER);
        Mono<HikariDataSource> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    String body = result.getBody().toString();
                    /*
                     * - Since the mode is 'prefer' and the testcontainer server does not support SSL, the connection
                     *   gets established without SSL layer.
                     */
                    assertTrue(body.contains("\"ssl\":false"));
                })
                .verifyComplete();
    }

    @Test
    public void testSslAllow() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select * from pg_stat_ssl");

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getConnection().getSsl().setAuthType(SSLDetails.AuthType.ALLOW);
        Mono<HikariDataSource> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    String body = result.getBody().toString();
                    /*
                     * - Since the mode is 'allow' and the testcontainer server does not support SSL, the connection
                     *   gets established without SSL layer.
                     */
                    assertTrue(body.contains("\"ssl\":false"));
                })
                .verifyComplete();
    }

    @Test
    public void testDuplicateColumnNames() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<HikariDataSource> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT id, username as id, password, email as password FROM users WHERE id = 1");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "false"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    assertNotEquals(0, result.getMessages().size());

                    String expectedMessage = "Your PostgreSQL query result may not have all the columns because "
                            + "duplicate column names were found for the column(s)";
                    assertTrue(result.getMessages().stream().anyMatch(message -> message.contains(expectedMessage)));

                    /*
                     * - Check if all the duplicate column names are reported.
                     */
                    Set<String> expectedColumnNames =
                            Stream.of("id", "password").collect(Collectors.toCollection(HashSet::new));
                    Set<String> foundColumnNames = new HashSet<>();
                    result.getMessages().stream()
                            .filter(message -> message.contains(expectedMessage))
                            .forEach(message -> {
                                Arrays.stream(message.split(":")[1].split("\\.")[0].split(","))
                                        .forEach(columnName -> foundColumnNames.add(columnName.trim()));
                            });
                    assertTrue(expectedColumnNames.equals(foundColumnNames));
                })
                .verifyComplete();
    }

    @Test
    public void testTimestampPreparedStatement() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("UPDATE public.\"users\" set " + "created_on = {{binding1}}\n" + "  where id = 3;");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param = new Param();
        param.setKey("binding1");
        param.setValue("2021-03-24 14:05:34");
        param.setClientDataType(ClientDataType.STRING);
        params.add(param);
        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono =
                pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(
                pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();

        actionConfiguration.setBody("SELECT * FROM public.\"users\" where id = 3;");
        resultMono = connectionCreateMono.flatMap(
                pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals(node.get("created_on").asText(), "2021-03-24T14:05:34Z");
                })
                .verifyComplete();
    }

    @Test
    public void testSettingCommentedBindingPreparedStatement() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT * FROM public.\"users\"; -- {{binding1}} in comment, should be ignored");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param = new Param();
        param.setKey("binding1");
        param.setValue("2021-03-24 14:05:34");
        param.setClientDataType(ClientDataType.STRING);
        params.add(param);
        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono =
                pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(
                pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();
    }

    @Test
    public void testDataTypes() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT * FROM dataTypeTest");
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<HikariDataSource> connectionPoolMono = pluginExecutor.datasourceCreate(dsConfig);
        Mono<ActionExecutionResult> resultMono = connectionPoolMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals("racket", node.get("item").get("type").asText());
                    assertEquals(
                            "butterfly", node.get("item").get("manufacturer").asText());
                    assertEquals("japan", node.get("origin").get("country").asText());
                    assertEquals("kyoto", node.get("origin").get("city").asText());
                    assertEquals("A Lincoln", node.get("citextdata").asText());
                })
                .verifyComplete();
    }

    @Test
    public void testPreparedStatementWithExplicitTypeCasting() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        String query =
                "INSERT INTO users (id, username, password, email, dob, rating) VALUES ({{id}}, {{firstName}}::varchar, {{lastName}}, {{email}}, {{date}}::date, {{rating}})";
        actionConfiguration.setBody(query);

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param = new Param("id", "10");
        param.setClientDataType(ClientDataType.NUMBER);
        params.add(param);

        param = new Param("firstName", "1001");
        param.setClientDataType(ClientDataType.STRING);
        params.add(param);

        param = new Param("lastName", "LastName");
        param.setClientDataType(ClientDataType.STRING);
        params.add(param);

        param = new Param("email", "email@email.com");
        param.setClientDataType(ClientDataType.STRING);
        params.add(param);

        param = new Param("date", "2018-12-31");
        param.setClientDataType(ClientDataType.STRING);
        params.add(param);

        param = new Param("rating", String.valueOf(5.1));
        param.setClientDataType(ClientDataType.NUMBER);
        params.add(param);

        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono =
                pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(
                pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals(node.get("affectedRows").asText(), "1");

                    List<RequestParamDTO> requestParams =
                            (List<RequestParamDTO>) result.getRequest().getRequestParams();
                    RequestParamDTO requestParamDTO = requestParams.get(0);
                    Map<String, Object> substitutedParams = requestParamDTO.getSubstitutedParams();
                    for (Map.Entry<String, Object> substitutedParam : substitutedParams.entrySet()) {
                        PsParameterDTO psParameter = (PsParameterDTO) substitutedParam.getValue();
                        switch (psParameter.getValue()) {
                            case "10":
                                assertEquals(psParameter.getType(), "INTEGER");
                                break;
                            case "1001":

                            case "LastName":

                            case "email@email.com":
                                assertEquals(psParameter.getType(), "STRING");
                                break;
                            case "2018-12-31":
                                assertEquals(psParameter.getType(), "DATE");
                                break;
                        }
                    }
                })
                .verifyComplete();

        actionConfiguration.setBody("SELECT * FROM public.\"users\" WHERE id=10;");
        final ActionExecutionResult actionExecutionResult = connectionCreateMono
                .flatMap(pool ->
                        pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration))
                .block();

        // Check that precision for decimal value is maintained
        assert actionExecutionResult != null;
        final JsonNode node = ((ArrayNode) actionExecutionResult.getBody()).get(0);
        assertEquals("5.1", node.get("rating").asText());

        // Delete the newly added row to not affect any other test case
        actionConfiguration.setBody("DELETE FROM users WHERE id = 10");
        connectionCreateMono
                .flatMap(pool ->
                        pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration))
                .block();
    }

    @Test
    public void testPreparedStatementWithTimeZoneTimeStamp() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(
                "UPDATE public.\"users\" set " + "created_on_tz = {{createdTS}}\n" + "  where id = 3;");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param = new Param("createdTS", "2022-04-11T05:30:00Z");
        param.setClientDataType(ClientDataType.STRING);
        params.add(param);

        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono =
                pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(
                pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();

        actionConfiguration.setBody("SELECT * FROM public.\"users\" where id = 3;");
        resultMono = connectionCreateMono.flatMap(
                pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals(node.get("created_on_tz").asText(), "2022-04-11T05:30:00Z"); // UTC time
                })
                .verifyComplete();
    }

    @Test
    public void testReadOnlyMode() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getConnection().setMode(com.appsmith.external.models.Connection.Mode.READ_ONLY);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("UPDATE public.\"users\" set created_on = '2021-03-24 14:05:34' where id = 3;");

        Mono<HikariDataSource> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    assertNotNull(result);

                    String expectedBody = "ERROR: cannot execute UPDATE in a read-only transaction";
                    assertEquals(expectedBody, result.getPluginErrorDetails().getDownstreamErrorMessage());
                })
                .verifyComplete();
    }

    @Test
    public void testPreparedStatementWithJsonDataType() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        String query =
                "INSERT INTO dataTypeTest VALUES ({{id}}, {{jsonObject1}}::json, {{jsonObject2}}::json, {{stringValue}})";
        actionConfiguration.setBody(query);

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param = new Param("id", "10");
        param.setClientDataType(ClientDataType.NUMBER);
        params.add(param);

        param = new Param("jsonObject1", "{\"type\":\"racket\", \"manufacturer\":\"butterfly\"}");
        param.setClientDataType(ClientDataType.OBJECT);
        params.add(param);

        param = new Param("jsonObject2", "{\"country\":\"japan\", \"city\":\"kyoto\"}");
        param.setClientDataType(ClientDataType.OBJECT);
        params.add(param);

        param = new Param("stringValue", "Something here");
        param.setClientDataType(ClientDataType.STRING);
        params.add(param);

        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono =
                pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(
                pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals(node.get("affectedRows").asText(), "1");

                    List<RequestParamDTO> requestParams =
                            (List<RequestParamDTO>) result.getRequest().getRequestParams();
                    RequestParamDTO requestParamDTO = requestParams.get(0);
                    Map<String, Object> substitutedParams = requestParamDTO.getSubstitutedParams();
                    for (Map.Entry<String, Object> substitutedParam : substitutedParams.entrySet()) {
                        PsParameterDTO psParameter = (PsParameterDTO) substitutedParam.getValue();
                        switch (psParameter.getValue()) {
                            case "10":
                                assertEquals(psParameter.getType(), "INTEGER");
                                break;
                            case "{\"type\":\"racket\", \"manufacturer\":\"butterfly\"}":

                            case "{\"country\":\"japan\", \"city\":\"kyoto\"}":
                                assertEquals(psParameter.getType(), "JSON_OBJECT");
                                break;
                            case "Something here":
                                assertEquals(psParameter.getType(), "STRING");
                                break;
                        }
                    }
                })
                .verifyComplete();

        // Delete the newly added row to not affect any other test case
        actionConfiguration.setBody("DELETE FROM users dataTypeTest id = 10");
        connectionCreateMono
                .flatMap(pool ->
                        pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration))
                .block();
    }

    @Test
    public void testNumericStringHavingLeadingZeroWithPreparedStatement() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT {{binding1}} as numeric_string;");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("binding1");
        param1.setValue("098765");
        param1.setClientDataType(ClientDataType.STRING);
        params.add(param1);
        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono =
                pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(
                pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertArrayEquals(
                            new String[] {"numeric_string"},
                            new ObjectMapper()
                                    .enable(StreamReadFeature.INCLUDE_SOURCE_IN_LOCATION.mappedFeature())
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray());

                    // Verify value
                    assertEquals(JsonNodeType.STRING, node.get("numeric_string").getNodeType());
                    assertEquals(param1.getValue(), node.get("numeric_string").asText());
                })
                .verifyComplete();
    }

    @Test
    public void verifyUniquenessOfPostgresPluginErrorCode() {
        assert (Arrays.stream(PostgresPluginError.values())
                        .map(PostgresPluginError::getAppErrorCode)
                        .distinct()
                        .count()
                == PostgresPluginError.values().length);

        assert (Arrays.stream(PostgresPluginError.values())
                        .map(PostgresPluginError::getAppErrorCode)
                        .filter(appErrorCode -> appErrorCode.length() != 11 || !appErrorCode.startsWith("PE-PGS"))
                        .collect(Collectors.toList())
                        .size()
                == 0);
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_endpointNotPresent_ReturnsEmptyString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        // setting endpoints to empty list
        dsConfig.setEndpoints(new ArrayList());

        final Mono<String> rateLimitIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(rateLimitIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_HostAbsent_ReturnsEmptyString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("");
        dsConfig.getEndpoints().get(0).setPort(5432L);

        final Mono<String> endPointIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_HostAndPortPresent_ReturnsCorrectString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("localhost");
        dsConfig.getEndpoints().get(0).setPort(5431L);

        final Mono<String> endPointIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("localhost_5431", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_HostPresentPortAbsent_ReturnsCorrectString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("localhost");
        dsConfig.getEndpoints().get(0).setPort(null);

        final Mono<String> endPointIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("localhost_5432", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_HostPresentPortAbsentSshEnabled_ReturnsCorrectString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("localhost");
        dsConfig.getEndpoints().get(0).setPort(null);

        // Set ssh enabled
        List<Property> properties = new ArrayList();
        properties.add(null);
        properties.add(new Property("Connection Method", "SSH"));
        dsConfig.setProperties(properties);

        final Mono<String> endPointIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("localhost_5432", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void
            testGetEndpointIdentifierForRateLimit_HostPresentPortAbsentSshEnabledwithHostAndPort_ReturnsCorrectString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("localhost");
        dsConfig.getEndpoints().get(0).setPort(null);

        // Set ssh enabled
        List<Property> properties = new ArrayList();
        properties.add(null);
        properties.add(new Property("Connection Method", "SSH"));
        dsConfig.setProperties(properties);

        SSHConnection sshProxy = new SSHConnection();
        sshProxy.setHost("sshHost");
        sshProxy.setPort(22L);
        dsConfig.setSshProxy(sshProxy);

        final Mono<String> endPointIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("localhost_5432_sshHost_22", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void
            testGetEndpointIdentifierForRateLimit_HostPresentPortAbsentSshEnabledwithHostAndNullPort_ReturnsCorrectString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("localhost");
        dsConfig.getEndpoints().get(0).setPort(null);

        // Set ssh enabled
        List<Property> properties = new ArrayList();
        properties.add(null);
        properties.add(new Property("Connection Method", "SSH"));
        dsConfig.setProperties(properties);

        SSHConnection sshProxy = new SSHConnection();
        sshProxy.setHost("sshHost");
        dsConfig.setSshProxy(sshProxy);

        final Mono<String> endPointIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("localhost_5432_sshHost_22", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void
            testGetEndpointIdentifierForRateLimit_EndpointAbsentSshEnabledwithHostAndNullPort_ReturnsCorrectString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        // Setting hostname and port
        dsConfig.setEndpoints(new ArrayList());

        // Set ssh enabled
        List<Property> properties = new ArrayList();
        properties.add(null);
        properties.add(new Property("Connection Method", "SSH"));
        dsConfig.setProperties(properties);

        SSHConnection sshProxy = new SSHConnection();
        sshProxy.setHost("sshHost");
        dsConfig.setSshProxy(sshProxy);

        final Mono<String> endPointIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("_sshHost_22", endpointIdentifier);
                })
                .verifyComplete();
    }
}
