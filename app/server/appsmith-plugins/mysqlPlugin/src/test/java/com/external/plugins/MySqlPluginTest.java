package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.PsParameterDTO;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.SSLDetails;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import io.r2dbc.spi.Connection;
import io.r2dbc.spi.ConnectionFactories;
import io.r2dbc.spi.ConnectionFactoryOptions;
import lombok.extern.log4j.Log4j;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.containers.MySQLR2DBCDatabaseContainer;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

@Log4j
public class MySqlPluginTest {

    MySqlPlugin.MySqlPluginExecutor pluginExecutor = new MySqlPlugin.MySqlPluginExecutor();

    @SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is pseudo-optional.
    @ClassRule
    public static MySQLContainer mySQLContainer = new MySQLContainer(
            DockerImageName.parse("mysql/mysql-server:8.0.25").asCompatibleSubstituteFor("mysql"))
            .withUsername("mysql")
            .withPassword("password")
            .withDatabaseName("test_db");

    @SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is pseudo-optional.
    @ClassRule
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

    @BeforeClass
    public static void setUp() {
        address = mySQLContainer.getContainerIpAddress();
        port = mySQLContainer.getFirstMappedPort();
        username = mySQLContainer.getUsername();
        password = mySQLContainer.getPassword();
        database = mySQLContainer.getDatabaseName();
        dsConfig = createDatasourceConfiguration();

        ConnectionFactoryOptions baseOptions = MySQLR2DBCDatabaseContainer.getOptions(mySQLContainer);
        ConnectionFactoryOptions.Builder ob = ConnectionFactoryOptions.builder().from(baseOptions);

        Mono.from(ConnectionFactories.get(ob.build()).create())
                .map(connection -> {
                    return connection.createBatch()
                            .add("create table users (\n" +
                                    "    id int auto_increment primary key,\n" +
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
                                    ")"
                            )
                            .add("create table possessions (\n" +
                                    "    id int primary key,\n" +
                                    "    title varchar (250) not null,\n" +
                                    "    user_id int not null,\n" +
                                    "    username varchar (250) not null,\n" +
                                    "    email varchar (250) not null\n" +
                                    ")"
                            )
                            .add("alter table possessions add foreign key (username, email) \n" +
                                    "references users (username, email)"
                            )
                            .add("SET SESSION sql_mode = '';\n")
                            .add("INSERT INTO users VALUES (" +
                                    "1, 'Jack', 'jill', 'jack@exemplars.com', NULL, '2018-12-31', 2018," +
                                    " '18:32:45'," +
                                    " '2018-11-30 20:45:15', '0000-00-00 00:00:00'" +
                                    ")"
                            )
                            .add("INSERT INTO users VALUES (" +
                                    "2, 'Jill', 'jack', 'jill@exemplars.com', NULL, '2019-12-31', 2019," +
                                    " '15:45:30'," +
                                    " '2019-11-30 23:59:59', '2019-11-30 23:59:59'" +
                                    ")"
                            );
                })
                .flatMap(batch -> Mono.from(batch.execute()))
                .block();

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

        return datasourceConfiguration;
    }

    @Test
    public void testConnectMySQLContainer() {

        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .assertNext(Assert::assertNotNull)
                .verifyComplete();
    }

    @Test
    public void testConnectMySQLContainerWithInvalidTimezone() {

        final DatasourceConfiguration dsConfig = createDatasourceConfigForContainerWithInvalidTZ();
        dsConfig.setProperties(List.of(
                new Property("serverTimezone", "UTC")
        ));

        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .assertNext(Assert::assertNotNull)
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
        final DatasourceConfiguration dsConfig = createDatasourceConfigForContainerWithInvalidTZ();

        // adding a user with empty password
        ConnectionFactoryOptions baseOptions = MySQLR2DBCDatabaseContainer.getOptions(mySQLContainerWithInvalidTimezone);
        ConnectionFactoryOptions.Builder ob = ConnectionFactoryOptions.builder().from(baseOptions);

        Mono.from(ConnectionFactories.get(ob.build()).create())
                .map(connection -> connection.createBatch()
                        // adding a new user called 'mysql' with empty password
                        .add("CREATE USER 'mysql'@'%';\n" +
                                "GRANT ALL PRIVILEGES ON *.* TO 'mysql'@'%' WITH GRANT OPTION;\n" +
                                "FLUSH PRIVILEGES;")
                        )
                .flatMap(batch -> Mono.from(batch.execute()))
                .block();


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
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .assertNext(Assert::assertNotNull)
                .verifyComplete();

        /* Expect no error */
        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> assertEquals(0, datasourceTestResult.getInvalids().size()))
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
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .assertNext(Assert::assertNotNull)
                .verifyComplete();

        /* Expect no error */
        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> assertEquals(0, datasourceTestResult.getInvalids().size()))
                .verifyComplete();

    }

    @Test
    public void testExecute() {
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("show databases");

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
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
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("show\n\tdatabases");

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
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
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select\n\t*\nfrom\nusers where id=1");

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
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
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_BODY,
                            actionConfiguration.getBody(), null, null, new HashMap<>()));
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testStaleConnectionCheck() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("show databases");
        Connection connection = pluginExecutor.datasourceCreate(dsConfig).block();

        Flux<ActionExecutionResult> resultFlux = Mono.from(connection.close())
                .thenMany(pluginExecutor.executeParameterized(connection, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(resultFlux)
                .expectErrorMatches(throwable -> throwable instanceof StaleConnectionException)
                .verify();
    }

    @Test
    public void testValidateDatasourceNullCredentials() {
        dsConfig.setConnection(new com.appsmith.external.models.Connection());
        DBAuth auth = (DBAuth) dsConfig.getAuthentication();
        auth.setUsername(null);
        auth.setPassword(null);
        auth.setDatabaseName("someDbName");
        Set<String> output = pluginExecutor.validateDatasource(dsConfig);
        assertTrue(output.contains("Missing username for authentication."));
        assertTrue(output.contains("Missing password for authentication."));
    }

    @Test
    public void testValidateDatasourceMissingDBName() {
        ((DBAuth) dsConfig.getAuthentication()).setDatabaseName("");
        Set<String> output = pluginExecutor.validateDatasource(dsConfig);
        assertTrue(output
                .stream()
                .anyMatch(error -> error.contains("Missing database name."))
        );
    }

    @Test
    public void testValidateDatasourceNullEndpoint() {
        dsConfig.setEndpoints(null);
        Set<String> output = pluginExecutor.validateDatasource(dsConfig);
        assertTrue(output
                .stream()
                .anyMatch(error -> error.contains("Missing endpoint and url"))
        );
    }

    @Test
    public void testValidateDatasource_NullHost() {
        dsConfig.setEndpoints(List.of(new Endpoint()));
        Set<String> output = pluginExecutor.validateDatasource(dsConfig);
        assertTrue(output
                .stream()
                .anyMatch(error -> error.contains("Host value cannot be empty"))
        );

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(address);
        endpoint.setPort(port.longValue());
        dsConfig.setEndpoints(List.of(endpoint));
    }

    @Test
    public void testValidateDatasourceInvalidEndpoint() {
        String hostname = "r2dbc:mysql://localhost";
        dsConfig.getEndpoints().get(0).setHost(hostname);
        Set<String> output = pluginExecutor.validateDatasource(dsConfig);
        assertTrue(output.contains("Host value cannot contain `/` or `:` characters. Found `" + hostname + "`."));
    }

    @Test
    public void testAliasColumnNames() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT id as user_id FROM users WHERE id = 1");

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

        return;
    }

    @Test
    public void testPreparedStatementErrorWithIsKeyword() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        /**
         * - MySQL r2dbc driver is not able to substitute the `True/False` value properly after the IS keyword.
         * Converting `True/False` to integer 1 or 0 also does not work in this case as MySQL syntax does not support
         * integers with IS keyword.
         * - I have raised an issue with r2dbc to track it: https://github.com/mirromutth/r2dbc-mysql/issues/200
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
        params.add(param1);

        executeActionDTO.setParams(params);

        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .verifyErrorSatisfies(error -> {
                    assertTrue(error instanceof AppsmithPluginException);
                    String expectedMessage = "Appsmith currently does not support the IS keyword with the prepared " +
                            "statement setting turned ON. Please re-write your SQL query without the IS keyword or " +
                            "turn OFF (unsafe) the 'Use prepared statement' knob from the settings tab.";
                    assertTrue(expectedMessage.equals(error.getMessage()));
                });
    }

    @Test
    public void testPreparedStatementWithRealTypes() {
        ConnectionFactoryOptions baseOptions = MySQLR2DBCDatabaseContainer.getOptions(mySQLContainer);
        ConnectionFactoryOptions.Builder ob = ConnectionFactoryOptions.builder().from(baseOptions);
        Mono.from(ConnectionFactories.get(ob.build()).create())
                .map(connection ->
                        connection.createBatch()
                            .add("create table test_real_types(id int, c_float float, c_double double, c_real real)")
                            .add("insert into test_real_types values (1, 1.123, 3.123, 5.123)")
                            .add("insert into test_real_types values (2, 11.123, 13.123, 15.123)")
                )
                .flatMap(batch -> Mono.from(batch.execute()))
                .block();

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        /**
         * - For mysql float / double / real types the actual values that are stored in the db my differ by a very
         * thin margin as long as they are approximately same. Hence adding comparison based check instead of direct
         * equality.
         * - Ref: https://dev.mysql.com/doc/refman/8.0/en/problems-with-float.html
         */
        actionConfiguration.setBody("SELECT id FROM test_real_types WHERE ABS(c_float - {{binding1}}) < 0.1 AND ABS" +
                "(c_double - {{binding2}}) < 0.1 AND ABS(c_real - {{binding3}}) < 0.1;");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("binding1");
        param1.setValue("1.123");
        params.add(param1);

        Param param2 = new Param();
        param2.setKey("binding2");
        param2.setValue("3.123");
        params.add(param2);

        Param param3 = new Param();
        param3.setKey("binding3");
        param3.setValue("5.123");
        params.add(param3);

        executeActionDTO.setParams(params);

        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    final JsonNode node = ((ArrayNode) result.getBody());
                    assertEquals(1, node.size());
                    // Verify selected row id.
                    assertEquals(1, node.get(0).get("id").asInt());
                })
                .verifyComplete();

        Mono.from(ConnectionFactories.get(ob.build()).create())
                .map(connection ->
                        connection.createBatch()
                                .add("drop table test_real_types")
                )
                .flatMap(batch -> Mono.from(batch.execute()))
                .block();
    }

    @Test
    public void testPreparedStatementWithBooleanType() {
        // Create a new table with boolean type
        ConnectionFactoryOptions baseOptions = MySQLR2DBCDatabaseContainer.getOptions(mySQLContainer);
        ConnectionFactoryOptions.Builder ob = ConnectionFactoryOptions.builder().from(baseOptions);
        Mono.from(ConnectionFactories.get(ob.build()).create())
                .map(connection ->
                        connection.createBatch()
                            .add("create table test_boolean_type(id int, c_boolean boolean)")
                            .add("insert into test_boolean_type values (1, True)")
                            .add("insert into test_boolean_type values (2, True)")
                            .add("insert into test_boolean_type values (3, False)")
                )
                .flatMap(batch -> Mono.from(batch.execute()))
                .block();

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

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
        params.add(param1);
        executeActionDTO.setParams(params);

        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    final JsonNode node = ((ArrayNode) result.getBody());
                    assertEquals(2, node.size());
                    // Verify selected row id.
                    assertEquals(1, node.get(0).get("id").asInt());
                    assertEquals(2, node.get(1).get("id").asInt());
                })
                .verifyComplete();

        Mono.from(ConnectionFactories.get(ob.build()).create())
                .map(connection ->
                        connection.createBatch()
                                .add("drop table test_boolean_type")
                )
                .flatMap(batch -> Mono.from(batch.execute()))
                .block();
    }

    @Test
    public void testExecuteWithPreparedStatement() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

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
        params.add(param1);
        Param param2 = new Param();
        param2.setKey("binding2");
        param2.setValue("0");
        params.add(param2);
        executeActionDTO.setParams(params);

        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertArrayEquals(
                            new String[]{
                                    "id"
                            },
                            new ObjectMapper()
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray()
                    );

                    // Verify value
                    assertEquals(1, node.get("id").asInt());

                    /*
                     * - Check if request params are sent back properly.
                     * - Not replicating the same to other tests as the overall flow remains the same w.r.t. request
                     *  params.
                     */

                    // Check if '?' is replaced by $i.
                    assertEquals("SELECT id FROM users WHERE id = $1 limit 1 offset $2;",
                            ((RequestParamDTO)(((List)result.getRequest().getRequestParams())).get(0)).getValue());

                    // Check 1st prepared statement parameter
                    PsParameterDTO expectedPsParam1 = new PsParameterDTO("1", "INTEGER");
                    PsParameterDTO returnedPsParam1 =
                            (PsParameterDTO) ((RequestParamDTO) (((List) result.getRequest().getRequestParams())).get(0)).getSubstitutedParams().get("$1");
                    // Check if prepared stmt param value is correctly sent back.
                    assertEquals(expectedPsParam1.getValue(), returnedPsParam1.getValue());
                    // Check if prepared stmt param type is correctly sent back.
                    assertEquals(expectedPsParam1.getType(), returnedPsParam1.getType());

                    // Check 2nd prepared statement parameter
                    PsParameterDTO expectedPsParam2 = new PsParameterDTO("0", "INTEGER");
                    PsParameterDTO returnedPsParam2 =
                            (PsParameterDTO) ((RequestParamDTO) (((List) result.getRequest().getRequestParams())).get(0)).getSubstitutedParams().get("$2");
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
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT * FROM users WHERE id = 1");

        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

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

    /**
     * 1. Add a test to check that mysql driver can interpret and read all the regular data types used in mysql.
     * 2. List of the data types is taken is from https://dev.mysql.com/doc/refman/8.0/en/data-types.html
     * 3. Data types tested here are: INTEGER, SMALLINT, TINYINT, MEDIUMINT, BIGINT, DECIMAL, FLOAT, DOUBLE, BIT,
     * DATE, DATETIME, TIMESTAMP, TIME, YEAR, CHAR, VARCHAR, BINARY, VARBINARY, TINYBLOB, BLOB, MEDIUMBLOB, LONGBLOB,
     * TINYTEXT, TEXT, MEDIUMTEXT, LONGTEXT, ENUM, SET, JSON, GEOMETRY, POINT
     */
    @Test
    public void testExecuteDataTypesExtensive() throws AppsmithPluginException {
        String query_create_table_numeric_types = "create table test_numeric_types (c_integer INTEGER, c_smallint " +
                "SMALLINT, c_tinyint TINYINT, c_mediumint MEDIUMINT, c_bigint BIGINT, c_decimal DECIMAL, c_float " +
                "FLOAT, c_double DOUBLE, c_bit BIT(10));";
        String query_insert_into_table_numeric_types = "insert into test_numeric_types values (-1, 1, 1, 10, 2000, 1" +
                ".02345, 0.1234, 1.0102344, b'0101010');";

        String query_create_table_date_time_types = "create table test_date_time_types (c_date DATE, c_datetime " +
                "DATETIME DEFAULT CURRENT_TIMESTAMP, c_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, c_time TIME, " +
                "c_year YEAR);";
        String query_insert_into_table_date_time_types = "insert into test_date_time_types values ('2020-12-01', " +
                "'2020-12-01 20:20:20', '2020-12-01 20:20:20', '20:20:20', 2020);";

        String query_create_table_data_types = "create table test_data_types (c_char CHAR(50), c_varchar VARCHAR(50)," +
                " c_binary BINARY(20), c_varbinary VARBINARY(20), c_tinyblob TINYBLOB, c_blob BLOB, c_mediumblob " +
                "MEDIUMBLOB, c_longblob LONGBLOB, c_tinytext TINYTEXT, c_text TEXT, c_mediumtext MEDIUMTEXT, " +
                "c_longtext LONGTEXT, c_enum ENUM('ONE'), c_set SET('a'));";
        String query_insert_data_types = "insert into test_data_types values ('test', 'test', 'a\\0\\t', 'a\\0\\t', " +
                "'test', 'test', 'test', 'test',  'test', 'test', 'test', 'test', 'ONE', 'a');";

        String query_create_table_json_data_type = "create table test_json_type (c_json JSON);";
        String query_insert_json_data_type = "insert into test_json_type values ('{\"key1\": \"value1\", \"key2\": " +
                "\"value2\"}');";

        String query_create_table_geometry_types = "create table test_geometry_types (c_geometry GEOMETRY, c_point " +
                "POINT);";
        String query_insert_geometry_types = "insert into test_geometry_types values (ST_GeomFromText('POINT(1 1)'), " +
                "ST_PointFromText('POINT(1 100)'));";

        String query_select_from_test_numeric_types = "select * from test_numeric_types;";
        String query_select_from_test_date_time_types = "select * from test_date_time_types;";
        String query_select_from_test_json_data_type = "select * from test_json_type;";
        String query_select_from_test_data_types = "select * from test_data_types;";
        String query_select_from_test_geometry_types = "select * from test_geometry_types;";

        ConnectionFactoryOptions baseOptions = MySQLR2DBCDatabaseContainer.getOptions(mySQLContainer);
        ConnectionFactoryOptions.Builder ob = ConnectionFactoryOptions.builder().from(baseOptions);
        Mono.from(ConnectionFactories.get(ob.build()).create())
                .map(connection -> {
                    return connection.createBatch()
                            .add(query_create_table_numeric_types)
                            .add(query_insert_into_table_numeric_types)
                            .add(query_create_table_date_time_types)
                            .add(query_insert_into_table_date_time_types)
                            .add(query_create_table_json_data_type)
                            .add(query_insert_json_data_type)
                            .add(query_create_table_data_types)
                            .add(query_insert_data_types)
                            .add(query_create_table_geometry_types)
                            .add(query_insert_geometry_types);
                })
                .flatMap(batch -> Mono.from(batch.execute()))
                .block();

        /* Test numeric types */
        testExecute(query_select_from_test_numeric_types);
        /* Test date time types */
        testExecute(query_select_from_test_date_time_types);
        /* Test data types */
        testExecute(query_select_from_test_data_types);
        /* Test data types */
        testExecute(query_select_from_test_json_data_type);
        /* Test data types */
        testExecute(query_select_from_test_geometry_types);

        return;
    }

    private void testExecute(String query) {
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(query);
        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
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
                                    new DatasourceStructure.Column("id", "int", null, false),
                                    new DatasourceStructure.Column("title", "varchar", null, false),
                                    new DatasourceStructure.Column("user_id", "int", null, false),
                                    new DatasourceStructure.Column("username", "varchar", null, false),
                                    new DatasourceStructure.Column("email", "varchar", null, false),
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
                                    new DatasourceStructure.Template("UPDATE", "UPDATE possessions SET\n" +
                                            "    id = 1,\n" +
                                            "    title = '',\n" +
                                            "    user_id = 1,\n" +
                                            "    username = '',\n" +
                                            "    email = ''\n" +
                                            "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!"),
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
                                    new DatasourceStructure.Template("UPDATE", "UPDATE users SET\n" +
                                            "    id = 1,\n" +
                                            "    username = '',\n" +
                                            "    password = '',\n" +
                                            "    email = '',\n" +
                                            "    spouse_dob = '2019-07-01',\n" +
                                            "    dob = '2019-07-01',\n" +
                                            "    yob = '',\n" +
                                            "    time1 = '',\n" +
                                            "    created_on = '2019-07-01 10:00:00',\n" +
                                            "    updated_on = '2019-07-01 10:00:00'\n" +
                                            "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!"),
                                    new DatasourceStructure.Template("DELETE", "DELETE FROM users\n" +
                                            "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!"),
                            },
                            usersTable.getTemplates().toArray()
                    );
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
    public void testSslDisabled() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("show session status like 'Ssl_cipher'");

        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DISABLED);
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(datasourceConfiguration);
        Mono<Object> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig,
                        actionConfiguration));
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
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(datasourceConfiguration);
        Mono<Object> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig,
                        actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    Object body = result.getBody();
                    assertNotNull(body);
                    assertEquals("[{\"Variable_name\":\"Ssl_cipher\",\"Value\":\"ECDHE-RSA-AES128-GCM-SHA256\"}]",
                            body.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testSslPreferred() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("show session status like 'Ssl_cipher'");

        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.PREFERRED);
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(datasourceConfiguration);
        Mono<Object> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig,
                        actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    Object body = result.getBody();
                    assertNotNull(body);
                    assertEquals("[{\"Variable_name\":\"Ssl_cipher\",\"Value\":\"ECDHE-RSA-AES128-GCM-SHA256\"}]",
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
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(datasourceConfiguration);
        Mono<Object> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig,
                        actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    Object body = result.getBody();
                    assertNotNull(body);
                    assertEquals("[{\"Variable_name\":\"Ssl_cipher\",\"Value\":\"ECDHE-RSA-AES128-GCM-SHA256\"}]",
                            body.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testDuplicateColumnNames() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT id, username as id, password, email as password FROM users WHERE id = 1");

        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    assertNotEquals(0, result.getMessages().size());

                    String expectedMessage = "Your MySQL query result may not have all the columns because duplicate column names " +
                            "were found for the column(s)";
                    assertTrue(
                            result.getMessages().stream()
                                    .anyMatch(message -> message.contains(expectedMessage))
                    );

                    /*
                     * - Check if all of the duplicate column names are reported.
                     */
                    Set<String> expectedColumnNames = Stream.of("id", "password")
                            .collect(Collectors.toCollection(HashSet::new));
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
}
