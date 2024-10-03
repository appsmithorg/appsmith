package com.external.plugins;

import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.ConnectionContext;
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
import com.external.plugins.exceptions.MySQLErrorMessages;
import com.external.plugins.exceptions.MySQLPluginError;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeType;
import io.r2dbc.pool.ConnectionPool;
import io.r2dbc.spi.Connection;
import io.r2dbc.spi.ConnectionFactories;
import io.r2dbc.spi.ConnectionFactoryOptions;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.mariadb.r2dbc.MariadbConnectionConfiguration;
import org.mariadb.r2dbc.MariadbConnectionFactory;
import org.reactivestreams.Publisher;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.containers.MySQLR2DBCDatabaseContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static java.lang.Boolean.TRUE;
import static java.lang.Thread.sleep;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static reactor.core.publisher.Mono.zip;

@Slf4j
@Testcontainers
public class MySqlPluginTest {

    static MySqlPlugin.MySqlPluginExecutor pluginExecutor = new MySqlPlugin.MySqlPluginExecutor();

    ConnectionContext<ConnectionPool> instanceConnectionContext;

    @AfterEach
    public void cleanup() {
        if (instanceConnectionContext != null && instanceConnectionContext.getConnection() != null) {
            instanceConnectionContext.getConnection().close();
        }
    }

    @SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is
    // pseudo-optional.
    @Container
    public static MySQLContainer mySQLContainer = new MySQLContainer(
                    DockerImageName.parse("mysql/mysql-server:8.0.25").asCompatibleSubstituteFor("mysql"))
            .withUsername("mysql")
            .withPassword("password")
            .withDatabaseName("test_db");

    @SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is
    // pseudo-optional.
    @Container
    public static MySQLContainer mySQLContainerWithInvalidTimezone = (MySQLContainer) new MySQLContainer(
                    DockerImageName.parse("mysql/mysql-server:8.0.25").asCompatibleSubstituteFor("mysql"))
            .withUsername("root")
            .withPassword("")
            .withDatabaseName("test_db")
            .withEnv("TZ", "PDT")
            .withEnv("MYSQL_ROOT_HOST", "%");

    private static String address;
    private static Integer port;
    private static String username;
    private static String password;
    private static String database;
    private static DatasourceConfiguration dsConfig;

    private static Mono<org.mariadb.r2dbc.api.MariadbConnection> getConnectionMonoFromContainer(
            MySQLContainer mySQLContainer) {
        ConnectionFactoryOptions baseOptions = MySQLR2DBCDatabaseContainer.getOptions(mySQLContainer);
        ConnectionFactoryOptions.Builder ob = ConnectionFactoryOptions.builder().from(baseOptions);
        MariadbConnectionConfiguration conf = MariadbConnectionConfiguration.fromOptions(ob.build())
                .allowPublicKeyRetrieval(true)
                .build();
        MariadbConnectionFactory connFactory = new MariadbConnectionFactory(conf);
        return connFactory.create();
    }

    @BeforeAll
    public static void setUp() {
        address = mySQLContainer.getContainerIpAddress();
        port = mySQLContainer.getFirstMappedPort();
        username = mySQLContainer.getUsername();
        password = mySQLContainer.getPassword();
        database = mySQLContainer.getDatabaseName();
        dsConfig = createDatasourceConfiguration();

        Mono.from(getConnectionMonoFromContainer(mySQLContainer))
                .map(connection -> {
                    return connection
                            .createBatch()
                            .add("DROP TABLE IF EXISTS possessions")
                            .add("DROP TABLE IF EXISTS users")
                            .add("create table users (\n" + "    id int auto_increment primary key,\n"
                                    + "    username varchar (250) unique not null,\n"
                                    + "    password varchar (250) not null,\n"
                                    + "    email varchar (250) unique not null,\n"
                                    + "    spouse_dob date,\n"
                                    + "    dob date not null,\n"
                                    + "    yob year not null,\n"
                                    + "    time1 time not null,\n"
                                    + "    created_on timestamp not null,\n"
                                    + "    updated_on datetime not null,\n"
                                    + "    constraint unique index (username, email)\n"
                                    + ")")
                            .add("create table possessions (\n" + "    id int primary key,\n"
                                    + "    title varchar (250) not null,\n"
                                    + "    user_id int not null,\n"
                                    + "    username varchar (250) not null,\n"
                                    + "    email varchar (250) not null\n"
                                    + ")")
                            .add("alter table possessions add foreign key (username, email) \n"
                                    + "references users (username, email)")
                            .add("SET SESSION sql_mode = '';\n")
                            .add("INSERT INTO users VALUES ("
                                    + "1, 'Jack', 'jill', 'jack@exemplars.com', NULL, '2018-12-31', 2018,"
                                    + " '18:32:45',"
                                    + " '2018-11-30 20:45:15', '0000-00-00 00:00:00'"
                                    + ")")
                            .add("INSERT INTO users VALUES ("
                                    + "2, 'Jill', 'jack', 'jill@exemplars.com', NULL, '2019-12-31', 2019,"
                                    + " '15:45:30',"
                                    + " '2019-11-30 23:59:59', '2019-11-30 23:59:59'"
                                    + ")");
                })
                .flatMapMany(batch -> Flux.from(batch.execute()))
                .blockLast(); // wait until completion of all the queries

        return;
    }

    private static DatasourceConfiguration createDatasourceConfiguration() {
        DBAuth authDTO = new DBAuth();
        authDTO.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authDTO.setUsername(username);
        authDTO.setPassword(password);
        authDTO.setDatabaseName(database);

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(address);
        endpoint.setPort(port.longValue());

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();

        /* set endpoint */
        datasourceConfiguration.setAuthentication(authDTO);
        datasourceConfiguration.setEndpoints(List.of(endpoint));

        /* set ssl mode */
        datasourceConfiguration.setConnection(new com.appsmith.external.models.Connection());
        datasourceConfiguration.getConnection().setSsl(new SSLDetails());
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);

        /* Set connection method toggle to `Standard` */
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null);
        properties.add(new Property("Connection method", "Standard"));
        datasourceConfiguration.setProperties(properties);

        return datasourceConfiguration;
    }

    @Test
    public void testConnectMySQLContainer() {

        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        StepVerifier.create(connectionContextMono)
                .assertNext(connectionContext -> {
                    assertTrue(connectionContext != null);
                    assertTrue(connectionContext.getConnection() != null);
                    assertFalse(connectionContext.getConnection().isDisposed());
                    assertTrue(connectionContext.getSshTunnelContext() == null);
                })
                .verifyComplete();
    }

    @Test
    public void testMySqlNoPasswordExceptionMessage() {

        dsConfig = createDatasourceConfiguration();
        ((DBAuth) dsConfig.getAuthentication()).setPassword("");

        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor.datasourceCreate(dsConfig);

        Mono<DatasourceTestResult> datasourceTestResultMono = connectionContextMono
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                })
                .flatMap(connectionPool -> pluginExecutor.testDatasource(connectionPool));

        String gateway = mySQLContainer.getContainerInfo().getNetworkSettings().getGateway();
        String expectedErrorMessage = new StringBuilder("Access denied for user 'mysql'@'")
                .append(gateway)
                .append("'")
                .toString();

        StepVerifier.create(datasourceTestResultMono)
                .assertNext(result -> {
                    assertTrue(result.getInvalids().contains(expectedErrorMessage));
                })
                .verifyComplete();
    }

    @Test
    public void testConnectMySQLContainerWithInvalidTimezone() {

        final DatasourceConfiguration dsConfig = createDatasourceConfigForContainerWithInvalidTZ();
        dsConfig.setProperties(List.of(new Property("serverTimezone", "UTC")));

        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        StepVerifier.create(connectionContextMono)
                .assertNext(Assertions::assertNotNull)
                .verifyComplete();
    }

    @Test
    public void testTestDatasource() {
        dsConfig = createDatasourceConfiguration();

        /* Expect no error */
        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> {
                    assertEquals(0, datasourceTestResult.getInvalids().size());
                })
                .verifyComplete();

        /* Create bad datasource configuration and expect error */
        dsConfig.getEndpoints().get(0).setHost("badHost");
        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> {
                    assertNotEquals(0, datasourceTestResult.getInvalids().size());
                })
                .verifyComplete();

        /* Reset dsConfig */
        dsConfig = createDatasourceConfiguration();
    }

    public DatasourceConfiguration createDatasourceConfigForContainerWithInvalidTZ() {
        final DBAuth authDTO = new DBAuth();
        authDTO.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authDTO.setUsername(mySQLContainerWithInvalidTimezone.getUsername());
        authDTO.setPassword(mySQLContainerWithInvalidTimezone.getPassword());
        authDTO.setDatabaseName(mySQLContainerWithInvalidTimezone.getDatabaseName());

        final Endpoint endpoint = new Endpoint();
        endpoint.setHost(mySQLContainerWithInvalidTimezone.getContainerIpAddress());
        endpoint.setPort(mySQLContainerWithInvalidTimezone.getFirstMappedPort().longValue());

        final DatasourceConfiguration dsConfig = new DatasourceConfiguration();

        /* set endpoint */
        dsConfig.setAuthentication(authDTO);
        dsConfig.setEndpoints(List.of(endpoint));

        /* set ssl mode */

        dsConfig.setConnection(new com.appsmith.external.models.Connection());
        dsConfig.getConnection().setMode(com.appsmith.external.models.Connection.Mode.READ_WRITE);
        dsConfig.getConnection().setSsl(new SSLDetails());
        dsConfig.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);

        return dsConfig;
    }

    @Test
    public void testDatasourceWithNullPassword() {
        // adding a user with empty password
        String sqlCmd = "CREATE USER 'mysql'@'%' IDENTIFIED BY '';"
                + "GRANT ALL PRIVILEGES ON *.* TO 'mysql'@'%' WITH GRANT OPTION;"
                + "FLUSH PRIVILEGES;";
        Mono.from(getConnectionMonoFromContainer(mySQLContainerWithInvalidTimezone))
                .map(connection -> connection
                        .createBatch()
                        .add("CREATE USER 'mysql'@'%' IDENTIFIED BY '';")
                        .add("GRANT ALL PRIVILEGES ON *.* TO 'mysql'@'%' WITH GRANT OPTION;")
                        .add("FLUSH PRIVILEGES;"))
                .flatMapMany(batch -> Flux.from(batch.execute()))
                .blockLast(); // wait until completion of all the queries

        final DatasourceConfiguration dsConfig = createDatasourceConfigForContainerWithInvalidTZ();
        // change to ordinary user
        DBAuth auth = ((DBAuth) dsConfig.getAuthentication());
        auth.setPassword("");
        auth.setUsername("mysql");

        // check user pass
        assertEquals("mysql", auth.getUsername());
        assertEquals("", auth.getPassword());

        // Validate datastore
        Set<String> output = pluginExecutor.validateDatasource(dsConfig);
        assertTrue(output.isEmpty());
        // test connect
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        StepVerifier.create(connectionContextMono)
                .assertNext(Assertions::assertNotNull)
                .verifyComplete();

        /* Expect no error */
        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult ->
                        assertEquals(0, datasourceTestResult.getInvalids().size()))
                .verifyComplete();
    }

    @Test
    public void testDatasourceWithRootUserAndNullPassword() {

        final DatasourceConfiguration dsConfig = createDatasourceConfigForContainerWithInvalidTZ();

        // check user pass
        assertEquals("root", mySQLContainerWithInvalidTimezone.getUsername());
        assertEquals("", mySQLContainerWithInvalidTimezone.getPassword());

        // Validate datastore
        Set<String> output = pluginExecutor.validateDatasource(dsConfig);
        assertTrue(output.isEmpty());
        // test connect
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        StepVerifier.create(connectionContextMono)
                .assertNext(Assertions::assertNotNull)
                .verifyComplete();

        /* Expect no error */
        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult ->
                        assertEquals(0, datasourceTestResult.getInvalids().size()))
                .verifyComplete();
    }

    @Test
    public void testExecute() {
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("show databases");

        Mono<Object> executeMono = connectionContextMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
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
    public void testExecuteWithFormattingWithShowCmd() {
        dsConfig = createDatasourceConfiguration();
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("show\n\tdatabases");

        Mono<Object> executeMono = connectionContextMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    String expectedBody = "[{\"Database\":\"information_schema\"},{\"Database\":\"test_db\"}]";
                    assertEquals(expectedBody, result.getBody().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteWithFormattingWithSelectCmd() {
        dsConfig = createDatasourceConfiguration();
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select\n\t*\nfrom\nusers where id=1");

        Mono<Object> executeMono = connectionContextMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals("2018-12-31", node.get("dob").asText());
                    assertEquals("2018", node.get("yob").asText());
                    assertEquals("Jack", node.get("username").asText());
                    assertEquals("jill", node.get("password").asText());
                    assertEquals("1", node.get("id").asText());
                    assertEquals("jack@exemplars.com", node.get("email").asText());
                    assertEquals("18:32:45", node.get("time1").asText());
                    assertEquals("2018-11-30T20:45:15Z", node.get("created_on").asText());

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at
                     * this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this
                     * point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(
                            ACTION_CONFIGURATION_BODY, actionConfiguration.getBody(), null, null, new HashMap<>()));
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteWithLongRunningQuery() {
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT SLEEP(20);");

        Mono<Object> executeMono = connectionContextMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
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
    public void testStaleConnectionCheck() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("show databases");
        ConnectionContext<ConnectionPool> connectionContext =
                pluginExecutor.datasourceCreate(dsConfig).block();
        instanceConnectionContext = connectionContext;
        Flux<ActionExecutionResult> resultFlux = Mono.from((connectionContext.getConnection()).disposeLater())
                .thenMany(pluginExecutor.executeParameterized(
                        connectionContext, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(resultFlux)
                .expectErrorMatches(throwable -> throwable instanceof StaleConnectionException)
                .verify();
    }

    @Test
    public void testAliasColumnNames() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT id as user_id FROM users WHERE id = 1");

        Mono<ActionExecutionResult> executeMono = connectionContextMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertArrayEquals(
                            new String[] {"user_id"},
                            new ObjectMapper()
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray());
                })
                .verifyComplete();

        return;
    }

    @Test
    public void testPreparedStatementErrorWithIsKeyword() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        /**
         * - MySQL r2dbc driver is not able to substitute the `True/False` value
         * properly after the IS keyword.
         * Converting `True/False` to integer 1 or 0 also does not work in this case as
         * MySQL syntax does not support
         * integers with IS keyword.
         * - I have raised an issue with r2dbc to track it:
         * https://github.com/mirromutth/r2dbc-mysql/issues/200
         */
        actionConfiguration.setBody("SELECT id FROM test_boolean_type WHERE c_boolean IS {{binding1}};");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("binding1");
        param1.setValue("True");
        param1.setClientDataType(ClientDataType.BOOLEAN);
        params.add(param1);

        executeActionDTO.setParams(params);

        Mono<ActionExecutionResult> executeMono = connectionContextMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono).verifyErrorSatisfies(error -> {
            assertTrue(error instanceof AppsmithPluginException);
            String expectedMessage = MySQLErrorMessages.IS_KEYWORD_NOT_SUPPORTED_IN_PS_ERROR_MSG;
            assertTrue(expectedMessage.equals(error.getMessage()));
        });
    }

    @Test
    public void testPreparedStatementWithRealTypes() {
        Mono.from(getConnectionMonoFromContainer(mySQLContainer))
                .map(connection -> connection
                        .createBatch()
                        .add("create table test_real_types(id int, c_float float, c_double double, c_real real)")
                        .add("insert into test_real_types values (1, 1.123, 3.123, 5.123)")
                        .add("insert into test_real_types values (2, 11.123, 13.123, 15.123)"))
                .flatMapMany(batch -> Flux.from(batch.execute()))
                .blockLast(); // wait until completion of all the queries

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        /**
         * - For mysql float / double / real types the actual values that are stored in
         * the db my differ by a very
         * thin margin as long as they are approximately same. Hence adding comparison
         * based check instead of direct
         * equality.
         * - Ref: https://dev.mysql.com/doc/refman/8.0/en/problems-with-float.html
         */
        actionConfiguration.setBody("SELECT id FROM test_real_types WHERE ABS(c_float - {{binding1}}) < 0.1 AND ABS"
                + "(c_double - {{binding2}}) < 0.1 AND ABS(c_real - {{binding3}}) < 0.1;");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("binding1");
        param1.setValue("1.123");
        param1.setClientDataType(ClientDataType.NUMBER);
        params.add(param1);

        Param param2 = new Param();
        param2.setKey("binding2");
        param2.setValue("3.123");
        param2.setClientDataType(ClientDataType.NUMBER);
        params.add(param2);

        Param param3 = new Param();
        param3.setKey("binding3");
        param3.setValue("5.123");
        param3.setClientDataType(ClientDataType.NUMBER);
        params.add(param3);

        executeActionDTO.setParams(params);

        Mono<ActionExecutionResult> executeMono = connectionContextMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    final JsonNode node = ((ArrayNode) result.getBody());
                    assertEquals(1, node.size());
                    // Verify selected row id.
                    assertEquals(1, node.get(0).get("id").asInt());
                })
                .verifyComplete();

        Mono.from(getConnectionMonoFromContainer(mySQLContainer))
                .map(connection -> connection.createBatch().add("drop table test_real_types"))
                .flatMapMany(batch -> Flux.from(batch.execute()))
                .blockLast(); // wait until completion of all the queries
    }

    private Publisher<? extends Connection> getConnectionFromBuilder(ConnectionFactoryOptions.Builder builder) {
        return ConnectionFactories.get(builder.build()).create();
    }

    @Test
    public void testPreparedStatementWithBooleanType() {
        // Create a new table with boolean type
        Mono.from(getConnectionMonoFromContainer(mySQLContainer))
                .map(connection -> connection
                        .createBatch()
                        .add("create table test_boolean_type(id int, c_boolean boolean)")
                        .add("insert into test_boolean_type values (1, True)")
                        .add("insert into test_boolean_type values (2, True)")
                        .add("insert into test_boolean_type values (3, False)"))
                .flatMapMany(batch -> Flux.from(batch.execute()))
                .blockLast(); // wait until completion of all the queries

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT id FROM test_boolean_type WHERE c_boolean={{binding1}};");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("binding1");
        param1.setValue("True");
        param1.setClientDataType(ClientDataType.BOOLEAN);
        params.add(param1);
        executeActionDTO.setParams(params);

        Mono<ActionExecutionResult> executeMono = connectionContextMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    final JsonNode node = ((ArrayNode) result.getBody());
                    assertEquals(2, node.size());
                    // Verify selected row id.
                    assertEquals(1, node.get(0).get("id").asInt());
                    assertEquals(2, node.get(1).get("id").asInt());
                })
                .verifyComplete();

        Mono.from(getConnectionMonoFromContainer(mySQLContainer))
                .map(connection -> connection.createBatch().add("drop table test_boolean_type"))
                .flatMapMany(batch -> Flux.from(batch.execute()))
                .blockLast(); // wait until completion of all the queries
    }

    @Test
    public void testExecuteWithPreparedStatement() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT id FROM users WHERE id = {{binding1}} limit 1 offset {{binding2}};");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("binding1");
        param1.setValue("1");
        param1.setClientDataType(ClientDataType.NUMBER);
        params.add(param1);
        Param param2 = new Param();
        param2.setKey("binding2");
        param2.setValue("0");
        param2.setClientDataType(ClientDataType.NUMBER);
        params.add(param2);
        executeActionDTO.setParams(params);

        Mono<ActionExecutionResult> executeMono = connectionContextMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertArrayEquals(
                            new String[] {"id"},
                            new ObjectMapper()
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray());

                    // Verify value
                    assertEquals(1, node.get("id").asInt());

                    /*
                     * - Check if request params are sent back properly.
                     * - Not replicating the same to other tests as the overall flow remains the
                     * same w.r.t. request
                     * params.
                     */

                    // Check if '?' is replaced by $i.
                    assertEquals(
                            "SELECT id FROM users WHERE id = $1 limit 1 offset $2;",
                            ((RequestParamDTO) (((List) result.getRequest().getRequestParams())).get(0)).getValue());

                    // Check 1st prepared statement parameter
                    PsParameterDTO expectedPsParam1 = new PsParameterDTO("1", "INTEGER");
                    PsParameterDTO returnedPsParam1 = (PsParameterDTO)
                            ((RequestParamDTO) (((List) result.getRequest().getRequestParams())).get(0))
                                    .getSubstitutedParams()
                                    .get("$1");
                    // Check if prepared stmt param value is correctly sent back.
                    assertEquals(expectedPsParam1.getValue(), returnedPsParam1.getValue());
                    // Check if prepared stmt param type is correctly sent back.
                    assertEquals(expectedPsParam1.getType(), returnedPsParam1.getType());

                    // Check 2nd prepared statement parameter
                    PsParameterDTO expectedPsParam2 = new PsParameterDTO("0", "INTEGER");
                    PsParameterDTO returnedPsParam2 = (PsParameterDTO)
                            ((RequestParamDTO) (((List) result.getRequest().getRequestParams())).get(0))
                                    .getSubstitutedParams()
                                    .get("$2");
                    // Check if prepared stmt param value is correctly sent back.
                    assertEquals(expectedPsParam2.getValue(), returnedPsParam2.getValue());
                    // Check if prepared stmt param type is correctly sent back.
                    assertEquals(expectedPsParam2.getType(), returnedPsParam2.getType());
                })
                .verifyComplete();

        return;
    }

    @Test
    public void testExecuteDataTypes() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT * FROM users WHERE id = 1");

        Mono<ActionExecutionResult> executeMono = connectionContextMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

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
                    assertTrue(node.get("updated_on").isNull());

                    assertArrayEquals(
                            new String[] {
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
                                    .toArray());
                })
                .verifyComplete();
    }

    /**
     * 1. Add a test to check that mysql driver can interpret and read all the
     * regular data types used in mysql.
     * 2. List of the data types is taken is from
     * https://dev.mysql.com/doc/refman/8.0/en/data-types.html
     * 3. Data types tested here are: INTEGER, SMALLINT, TINYINT, MEDIUMINT, BIGINT,
     * DECIMAL, FLOAT, DOUBLE, BIT,
     * DATE, DATETIME, TIMESTAMP, TIME, YEAR, CHAR, VARCHAR, BINARY, VARBINARY,
     * TINYBLOB, BLOB, MEDIUMBLOB, LONGBLOB,
     * TINYTEXT, TEXT, MEDIUMTEXT, LONGTEXT, ENUM, SET, JSON, GEOMETRY, POINT
     */
    @Test
    public void testExecuteDataTypesExtensive() throws AppsmithPluginException {
        String query_create_table_numeric_types = "create table test_numeric_types (c_integer INTEGER, c_smallint "
                + "SMALLINT, c_tinyint TINYINT, c_mediumint MEDIUMINT, c_bigint BIGINT, c_decimal DECIMAL, c_float "
                + "FLOAT, c_double DOUBLE, c_bit BIT(10));";
        String query_insert_into_table_numeric_types = "insert into test_numeric_types values (-1, 1, 1, 10, 2000, 1"
                + ".02345, 0.1234, 1.0102344, b'0101010');";

        String query_create_table_date_time_types = "create table test_date_time_types (c_date DATE, c_datetime "
                + "DATETIME DEFAULT CURRENT_TIMESTAMP, c_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, c_time TIME, "
                + "c_year YEAR);";
        String query_insert_into_table_date_time_types = "insert into test_date_time_types values ('2020-12-01', "
                + "'2020-12-01 20:20:20', '2020-12-01 20:20:20', '20:20:20', 2020);";

        String query_create_table_data_types = "create table test_data_types (c_char CHAR(50), c_varchar VARCHAR(50),"
                + " c_binary BINARY(20), c_varbinary VARBINARY(20), c_tinyblob TINYBLOB, c_blob BLOB, c_mediumblob "
                + "MEDIUMBLOB, c_longblob LONGBLOB, c_tinytext TINYTEXT, c_text TEXT, c_mediumtext MEDIUMTEXT, "
                + "c_longtext LONGTEXT, c_enum ENUM('ONE'), c_set SET('a'));";
        String query_insert_data_types = "insert into test_data_types values ('test', 'test', 'a\\0\\t', 'a\\0\\t', "
                + "'test', 'test', 'test', 'test',  'test', 'test', 'test', 'test', 'ONE', 'a');";

        String query_create_table_json_data_type = "create table test_json_type (id INTEGER, c_json JSON);";
        String query_insert_json_data_type_1 =
                "insert into test_json_type values (1, '{\"key1\": \"value1\", \"key2\": " + "\"value2\"}');";
        String query_insert_json_data_type_2 = "insert into test_json_type values (2, NULL);";

        String query_create_table_geometry_types =
                "create table test_geometry_types (c_geometry GEOMETRY, c_point " + "POINT);";
        String query_insert_geometry_types = "insert into test_geometry_types values (ST_GeomFromText('POINT(1 1)'), "
                + "ST_PointFromText('POINT(1 100)'));";

        String query_select_from_test_numeric_types = "select * from test_numeric_types;";
        String query_select_from_test_date_time_types = "select * from test_date_time_types;";
        String query_select_from_test_json_data_type_1 = "select c_json from test_json_type where id=1;";
        String query_select_from_test_json_data_type_2 = "select c_json from test_json_type where id=2;";
        String query_select_from_test_data_types = "select * from test_data_types;";
        String query_select_from_test_geometry_types = "select * from test_geometry_types;";

        String expected_numeric_types_result = "[{\"c_integer\":-1,\"c_smallint\":1,\"c_tinyint\":1,\""
                + "c_mediumint\":10,\"c_bigint\":2000,\"c_decimal\":1,\"c_float\":0.1234,\"c_double\":1.0102344,"
                + "\"c_bit\":{\"empty\":false}}]";

        String expected_date_time_types_result = "[{\"c_date\":\"2020-12-01\",\"c_datetime\":\"2020-12-01T20:20:20Z\","
                + "\"c_timestamp\":\"2020-12-01T20:20:20Z\",\"c_time\":\"20:20:20\",\"c_year\":2020}]";

        String expected_data_types_result = "[{\"c_char\":\"test\",\"c_varchar\":\"test\","
                + "\"c_binary\":\"YQAJAAAAAAAAAAAAAAAAAAAAAAA=\",\"c_varbinary\":\"YQAJ\",\"c_tinyblob\":\"dGVzdA==\","
                + "\"c_blob\":\"dGVzdA==\",\"c_mediumblob\":\"dGVzdA==\",\"c_longblob\":\"dGVzdA==\",\"c_tinytext\":\"test\","
                + "\"c_text\":\"test\",\"c_mediumtext\":\"test\",\"c_longtext\":\"test\",\"c_enum\":\"ONE\",\"c_set\":\"a\"}]";

        String expected_json_result_1 =
                "[{\"c_json\":\"{\\\"key1\\\": \\\"value1\\\", \\\"key2\\\": \\\"value2\\\"}\"}]";
        String expected_json_result_2 = "[{\"c_json\":null}]";

        String expected_geometry_types_result = "[{\"c_geometry\":\"AAAAAAEBAAAAAAAAAAAA8D8AAAAAAADwPw==\","
                + "\"c_point\":\"AAAAAAEBAAAAAAAAAAAA8D8AAAAAAABZQA==\"}]";

        Mono.from(getConnectionMonoFromContainer(mySQLContainer))
                .map(connection -> {
                    return connection
                            .createBatch()
                            .add(query_create_table_numeric_types)
                            .add(query_insert_into_table_numeric_types)
                            .add(query_create_table_date_time_types)
                            .add(query_insert_into_table_date_time_types)
                            .add(query_create_table_json_data_type)
                            .add(query_insert_json_data_type_1)
                            .add(query_insert_json_data_type_2)
                            .add(query_create_table_data_types)
                            .add(query_insert_data_types)
                            .add(query_create_table_geometry_types)
                            .add(query_insert_geometry_types);
                })
                .flatMapMany(batch -> Flux.from(batch.execute()))
                .blockLast(); // wait until completion of all the queries

        /* Test numeric types */
        testExecute(query_select_from_test_numeric_types, expected_numeric_types_result);
        /* Test date time types */
        testExecute(query_select_from_test_date_time_types, expected_date_time_types_result);
        /* Test data types */
        testExecute(query_select_from_test_data_types, expected_data_types_result);
        /* Test json type */
        testExecute(query_select_from_test_json_data_type_1, expected_json_result_1);
        testExecute(query_select_from_test_json_data_type_2, expected_json_result_2);
        /* Test geometry types */
        testExecute(query_select_from_test_geometry_types, expected_geometry_types_result);

        return;
    }

    private void testExecute(String query, String expectedResult) {
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(query);
        Mono<Object> executeMono = connectionContextMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    if (expectedResult != null) {
                        assertEquals(expectedResult, result.getBody().toString());
                    }
                })
                .verifyComplete();
    }

    @Test
    public void testStructure() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<DatasourceStructure> structureMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .flatMap(connection -> {
                    instanceConnectionContext = connection;
                    return pluginExecutor.getStructure(connection, dsConfig);
                });

        StepVerifier.create(structureMono)
                .assertNext(structure -> {
                    assertNotNull(structure);
                    assertEquals(2, structure.getTables().size());

                    Optional<DatasourceStructure.Table> possessionsTableOptional = structure.getTables().stream()
                            .filter(table -> table.getName().equalsIgnoreCase("possessions"))
                            .findFirst();
                    assertTrue(possessionsTableOptional.isPresent());
                    final DatasourceStructure.Table possessionsTable = possessionsTableOptional.get();
                    assertEquals(DatasourceStructure.TableType.TABLE, possessionsTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[] {
                                new DatasourceStructure.Column("id", "int", null, false),
                                new DatasourceStructure.Column("title", "varchar", null, false),
                                new DatasourceStructure.Column("user_id", "int", null, false),
                                new DatasourceStructure.Column("username", "varchar", null, false),
                                new DatasourceStructure.Column("email", "varchar", null, false),
                            },
                            possessionsTable.getColumns().toArray());

                    final DatasourceStructure.PrimaryKey possessionsPrimaryKey =
                            new DatasourceStructure.PrimaryKey("PRIMARY", List.of("id"));
                    final DatasourceStructure.ForeignKey possessionsUserForeignKey = new DatasourceStructure.ForeignKey(
                            "possessions_ibfk_1",
                            List.of("username", "email"),
                            List.of("users.username", "users.email"));
                    assertArrayEquals(
                            new DatasourceStructure.Key[] {possessionsPrimaryKey, possessionsUserForeignKey},
                            possessionsTable.getKeys().toArray());

                    assertArrayEquals(
                            new DatasourceStructure.Template[] {
                                new DatasourceStructure.Template("SELECT", "SELECT * FROM possessions LIMIT 10;", true),
                                new DatasourceStructure.Template(
                                        "INSERT",
                                        "INSERT INTO possessions (id, title, user_id, username, email)\n"
                                                + "  VALUES (1, '', 1, '', '');",
                                        false),
                                new DatasourceStructure.Template(
                                        "UPDATE",
                                        "UPDATE possessions SET\n" + "    id = 1,\n"
                                                + "    title = '',\n"
                                                + "    user_id = 1,\n"
                                                + "    username = '',\n"
                                                + "    email = ''\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!",
                                        false),
                                new DatasourceStructure.Template(
                                        "DELETE",
                                        "DELETE FROM possessions\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!",
                                        false),
                            },
                            possessionsTable.getTemplates().toArray());

                    Optional<DatasourceStructure.Table> usersTableOptional = structure.getTables().stream()
                            .filter(table -> table.getName().equalsIgnoreCase("users"))
                            .findFirst();
                    assertTrue(usersTableOptional.isPresent());
                    final DatasourceStructure.Table usersTable = usersTableOptional.get();
                    assertEquals(DatasourceStructure.TableType.TABLE, usersTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[] {
                                new DatasourceStructure.Column("id", "int", null, true),
                                new DatasourceStructure.Column("username", "varchar", null, false),
                                new DatasourceStructure.Column("password", "varchar", null, false),
                                new DatasourceStructure.Column("email", "varchar", null, false),
                                new DatasourceStructure.Column("spouse_dob", "date", null, false),
                                new DatasourceStructure.Column("dob", "date", null, false),
                                new DatasourceStructure.Column("yob", "year", null, false),
                                new DatasourceStructure.Column("time1", "time", null, false),
                                new DatasourceStructure.Column("created_on", "timestamp", null, false),
                                new DatasourceStructure.Column("updated_on", "datetime", null, false)
                            },
                            usersTable.getColumns().toArray());

                    final DatasourceStructure.PrimaryKey usersPrimaryKey =
                            new DatasourceStructure.PrimaryKey("PRIMARY", List.of("id"));
                    assertArrayEquals(
                            new DatasourceStructure.Key[] {usersPrimaryKey},
                            usersTable.getKeys().toArray());

                    assertArrayEquals(
                            new DatasourceStructure.Template[] {
                                new DatasourceStructure.Template("SELECT", "SELECT * FROM users LIMIT 10;", true),
                                new DatasourceStructure.Template(
                                        "INSERT",
                                        "INSERT INTO users (id, username, password, email, spouse_dob, dob, yob, time1, created_on, updated_on)\n"
                                                + "  VALUES (1, '', '', '', '2019-07-01', '2019-07-01', '', '', '2019-07-01 10:00:00', '2019-07-01 10:00:00');",
                                        false),
                                new DatasourceStructure.Template(
                                        "UPDATE",
                                        "UPDATE users SET\n" + "    id = 1,\n"
                                                + "    username = '',\n"
                                                + "    password = '',\n"
                                                + "    email = '',\n"
                                                + "    spouse_dob = '2019-07-01',\n"
                                                + "    dob = '2019-07-01',\n"
                                                + "    yob = '',\n"
                                                + "    time1 = '',\n"
                                                + "    created_on = '2019-07-01 10:00:00',\n"
                                                + "    updated_on = '2019-07-01 10:00:00'\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!",
                                        false),
                                new DatasourceStructure.Template(
                                        "DELETE",
                                        "DELETE FROM users\n"
                                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!",
                                        false),
                            },
                            usersTable.getTemplates().toArray());
                })
                .verifyComplete();
    }

    @Test
    public void testSslDisabled() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("show session status like 'Ssl_cipher'");

        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DISABLED);
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(datasourceConfiguration)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });
        Mono<Object> executeMono = connectionContextMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    Object body = result.getBody();
                    assertNotNull(body);
                    assertEquals("[{\"Variable_name\":\"Ssl_cipher\",\"Value\":\"\"}]", body.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testSslRequired() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("show session status like 'Ssl_cipher'");

        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.REQUIRED);
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono =
                pluginExecutor.datasourceCreate(datasourceConfiguration);
        Mono<Object> executeMono = connectionContextMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    Object body = result.getBody();
                    assertNotNull(body);
                    assertEquals(
                            "[{\"Variable_name\":\"Ssl_cipher\",\"Value\":\"TLS_AES_128_GCM_SHA256\"}]",
                            body.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testSslDefault() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("show session status like 'Ssl_cipher'");

        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });
        Mono<Object> executeMono = connectionContextMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    Object body = result.getBody();
                    assertNotNull(body);
                    assertEquals("[{\"Variable_name\":\"Ssl_cipher\",\"Value\":\"\"}]", body.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testDuplicateColumnNames() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT id, username as id, password, email as password FROM users WHERE id = 1");

        Mono<ActionExecutionResult> executeMono = connectionContextMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    assertNotEquals(0, result.getMessages().size());

                    String expectedMessage =
                            "Your MySQL query result may not have all the columns because duplicate column names "
                                    + "were found for the column(s)";
                    assertTrue(result.getMessages().stream().anyMatch(message -> message.contains(expectedMessage)));

                    /*
                     * - Check if all of the duplicate column names are reported.
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
    public void testExecuteDescribeTableCmd() {
        dsConfig = createDatasourceConfiguration();
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("describe users");

        Mono<Object> executeMono = connectionContextMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    String expectedBody =
                            "[{\"Field\":\"id\",\"Type\":\"int\",\"Null\":\"NO\",\"Key\":\"PRI\",\"Default\":null,\"Extra\":\"auto_increment\"},{\"Field\":\"username\",\"Type\":\"varchar(250)\",\"Null\":\"NO\",\"Key\":\"UNI\",\"Default\":null,\"Extra\":\"\"},{\"Field\":\"password\",\"Type\":\"varchar(250)\",\"Null\":\"NO\",\"Key\":\"\",\"Default\":null,\"Extra\":\"\"},{\"Field\":\"email\",\"Type\":\"varchar(250)\",\"Null\":\"NO\",\"Key\":\"UNI\",\"Default\":null,\"Extra\":\"\"},{\"Field\":\"spouse_dob\",\"Type\":\"date\",\"Null\":\"YES\",\"Key\":\"\",\"Default\":null,\"Extra\":\"\"},{\"Field\":\"dob\",\"Type\":\"date\",\"Null\":\"NO\",\"Key\":\"\",\"Default\":null,\"Extra\":\"\"},{\"Field\":\"yob\",\"Type\":\"year\",\"Null\":\"NO\",\"Key\":\"\",\"Default\":null,\"Extra\":\"\"},{\"Field\":\"time1\",\"Type\":\"time\",\"Null\":\"NO\",\"Key\":\"\",\"Default\":null,\"Extra\":\"\"},{\"Field\":\"created_on\",\"Type\":\"timestamp\",\"Null\":\"NO\",\"Key\":\"\",\"Default\":null,\"Extra\":\"\"},{\"Field\":\"updated_on\",\"Type\":\"datetime\",\"Null\":\"NO\",\"Key\":\"\",\"Default\":null,\"Extra\":\"\"}]";
                    assertEquals(expectedBody, result.getBody().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteDescTableCmd() {
        dsConfig = createDatasourceConfiguration();
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("desc users");

        Mono<Object> executeMono = connectionContextMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    String expectedBody =
                            "[{\"Field\":\"id\",\"Type\":\"int\",\"Null\":\"NO\",\"Key\":\"PRI\",\"Default\":null,\"Extra\":\"auto_increment\"},{\"Field\":\"username\",\"Type\":\"varchar(250)\",\"Null\":\"NO\",\"Key\":\"UNI\",\"Default\":null,\"Extra\":\"\"},{\"Field\":\"password\",\"Type\":\"varchar(250)\",\"Null\":\"NO\",\"Key\":\"\",\"Default\":null,\"Extra\":\"\"},{\"Field\":\"email\",\"Type\":\"varchar(250)\",\"Null\":\"NO\",\"Key\":\"UNI\",\"Default\":null,\"Extra\":\"\"},{\"Field\":\"spouse_dob\",\"Type\":\"date\",\"Null\":\"YES\",\"Key\":\"\",\"Default\":null,\"Extra\":\"\"},{\"Field\":\"dob\",\"Type\":\"date\",\"Null\":\"NO\",\"Key\":\"\",\"Default\":null,\"Extra\":\"\"},{\"Field\":\"yob\",\"Type\":\"year\",\"Null\":\"NO\",\"Key\":\"\",\"Default\":null,\"Extra\":\"\"},{\"Field\":\"time1\",\"Type\":\"time\",\"Null\":\"NO\",\"Key\":\"\",\"Default\":null,\"Extra\":\"\"},{\"Field\":\"created_on\",\"Type\":\"timestamp\",\"Null\":\"NO\",\"Key\":\"\",\"Default\":null,\"Extra\":\"\"},{\"Field\":\"updated_on\",\"Type\":\"datetime\",\"Null\":\"NO\",\"Key\":\"\",\"Default\":null,\"Extra\":\"\"}]";
                    assertEquals(expectedBody, result.getBody().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testNullObjectWithPreparedStatement() {
        pluginExecutor = spy(new MySqlPlugin.MySqlPluginExecutor());
        doReturn(false).when(pluginExecutor).isIsOperatorUsed(any());
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT * from (\n" + "\tselect 'Appsmith' as company_name, true as open_source\n"
                + "\tunion\n"
                + "\tselect 'Retool' as company_name, false as open_source\n"
                + "\tunion\n"
                + "\tselect 'XYZ' as company_name, null as open_source\n"
                + ") t\n"
                + "where t.open_source IS {{binding1}}");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("binding1");
        param1.setValue(null);
        param1.setClientDataType(ClientDataType.NULL);
        params.add(param1);
        executeActionDTO.setParams(params);

        Mono<ActionExecutionResult> executeMono = connectionContextMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertArrayEquals(
                            new String[] {"company_name", "open_source"},
                            new ObjectMapper()
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray());

                    // Verify value
                    assertEquals(JsonNodeType.NULL, node.get("open_source").getNodeType());
                })
                .verifyComplete();
    }

    @Test
    public void testNullAsStringWithPreparedStatement() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT * from (\n" + "\tselect 'Appsmith' as company_name, true as open_source\n"
                + "\tunion\n"
                + "\tselect 'Retool' as company_name, false as open_source\n"
                + "\tunion\n"
                + "\tselect 'XYZ' as company_name, 'null' as open_source\n"
                + ") t\n"
                + "where t.open_source = {{binding1}};");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("binding1");
        param1.setValue("null");
        param1.setClientDataType(ClientDataType.STRING);
        params.add(param1);

        executeActionDTO.setParams(params);

        Mono<ActionExecutionResult> executeMono = connectionContextMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertArrayEquals(
                            new String[] {"company_name", "open_source"},
                            new ObjectMapper()
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray());

                    // Verify value
                    assertEquals(JsonNodeType.STRING, node.get("open_source").getNodeType());
                })
                .verifyComplete();
    }

    @Test
    public void testNumericValuesHavingLeadingZeroWithPreparedStatement() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

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

        Mono<ActionExecutionResult> executeMono = connectionContextMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertArrayEquals(
                            new String[] {"numeric_string"},
                            new ObjectMapper()
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
    public void testLongValueWithPreparedStatement() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<ConnectionContext<ConnectionPool>> connectionContextMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                });

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select id from users LIMIT {{binding1}}");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("binding1");
        param1.setValue("2147483648");
        param1.setClientDataType(ClientDataType.NUMBER);
        params.add(param1);
        executeActionDTO.setParams(params);

        Mono<ActionExecutionResult> executeMono = connectionContextMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertArrayEquals(
                            new String[] {"id"},
                            new ObjectMapper()
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray());

                    // Verify value
                    assertEquals(JsonNodeType.NUMBER, node.get("id").getNodeType());
                })
                .verifyComplete();
    }

    @Test
    public void testDatasourceDestroy() {
        dsConfig = createDatasourceConfiguration();
        Mono<ConnectionContext<ConnectionPool>> connectionContextMonoCache = pluginExecutor
                .datasourceCreate(dsConfig)
                .map(connectionPool -> {
                    instanceConnectionContext = connectionPool;
                    return connectionPool;
                })
                .cache();
        Mono<DatasourceTestResult> testConnResultMono =
                connectionContextMonoCache.flatMap(conn -> pluginExecutor.testDatasource(conn));
        Mono<Tuple2<ConnectionContext<ConnectionPool>, DatasourceTestResult>> zipMono =
                zip(connectionContextMonoCache, testConnResultMono);
        StepVerifier.create(zipMono)
                .assertNext(tuple2 -> {
                    DatasourceTestResult testDsResult = tuple2.getT2();
                    assertEquals(0, testDsResult.getInvalids().size());

                    ConnectionContext<ConnectionPool> connectionContext = tuple2.getT1();
                    pluginExecutor.datasourceDestroy(connectionContext);
                    try {
                        /**
                         * We need to wait a few seconds before the next check because
                         * `datasourceDestroy` for MySQL Plugin is a non-blocking operation scheduled on
                         * a separate thread. We are hoping that by the time sleep ends, the other
                         * thread has finished execution.
                         */
                        sleep(5000);
                    } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                    }
                    assertTrue((connectionContext.getConnection()).isDisposed());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteCommon_queryWithComments_callValidationCallsAfterRemovingComments() {
        MySqlPlugin.MySqlPluginExecutor spyPlugin = spy(pluginExecutor);

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        ConnectionContext<ConnectionPool> connectionContext =
                pluginExecutor.datasourceCreate(dsConfig).block();
        instanceConnectionContext = connectionContext;

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT id FROM users WHERE -- IS operator\nid = 1 limit 1;");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);
        HashMap<String, Object> requestData = new HashMap<>();

        Mono<ActionExecutionResult> resultMono =
                spyPlugin.executeCommon(connectionContext, actionConfiguration, TRUE, null, null, requestData);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    verify(spyPlugin).isIsOperatorUsed("SELECT id FROM users WHERE \nid = 1 limit 1;");

                    verify(spyPlugin).getIsSelectOrShowOrDescQuery("SELECT id FROM users WHERE \nid = 1 limit 1;");
                })
                .verifyComplete();
    }

    @Test
    public void verifyUniquenessOfMySQLPluginErrorCode() {
        assert (Arrays.stream(MySQLPluginError.values())
                        .map(MySQLPluginError::getAppErrorCode)
                        .distinct()
                        .count()
                == MySQLPluginError.values().length);

        assert (Arrays.stream(MySQLPluginError.values())
                        .map(MySQLPluginError::getAppErrorCode)
                        .filter(appErrorCode -> appErrorCode.length() != 11 || !appErrorCode.startsWith("PE-MYS"))
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
        dsConfig.getEndpoints().get(0).setPort(3306L);

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
        dsConfig.getEndpoints().get(0).setPort(33L);

        final Mono<String> endPointIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("localhost_33", endpointIdentifier);
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
                    assertEquals("localhost_3306", endpointIdentifier);
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
                    assertEquals("localhost_3306", endpointIdentifier);
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
        sshProxy.setPort(223L);
        dsConfig.setSshProxy(sshProxy);

        final Mono<String> endPointIdentifierMono = pluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("localhost_3306_sshHost_223", endpointIdentifier);
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
                    assertEquals("localhost_3306_sshHost_22", endpointIdentifier);
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
