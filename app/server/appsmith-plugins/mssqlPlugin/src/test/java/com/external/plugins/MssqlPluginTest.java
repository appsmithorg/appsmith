package com.external.plugins;

import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.PsParameterDTO;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.SSLDetails;
import com.external.plugins.exceptions.MssqlErrorMessages;
import com.external.plugins.exceptions.MssqlPluginError;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeType;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.external.plugins.MssqlTestDBContainerManager.createDatasourceConfiguration;
import static com.external.plugins.MssqlTestDBContainerManager.mssqlPluginExecutor;
import static com.external.plugins.MssqlTestDBContainerManager.runSQLQueryOnMssqlTestDB;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
@Disabled
public class MssqlPluginTest {

    @SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is pseudo-optional.
    @Container
    public static final MSSQLServerContainer container = MssqlTestDBContainerManager.getMssqlDBForTest();

    private static HikariDataSource sharedConnectionPool = null;

    private static final String CREATE_USER_TABLE_QUERY =
            "CREATE TABLE users (\n" + "    id int identity (1, 1) NOT NULL,\n"
                    + "    username VARCHAR (50),\n"
                    + "    password VARCHAR (50),\n"
                    + "    email VARCHAR (355),\n"
                    + "    spouse_dob DATE,\n"
                    + "    dob DATE NOT NULL,\n"
                    + "    time1 TIME NOT NULL,\n"
                    + "    constraint pk_users_id primary key (id)\n"
                    + ")";

    private static final String SET_IDENTITY_INSERT_USERS_QUERY = "SET IDENTITY_INSERT users ON;";

    private static final String INSERT_USER1_QUERY =
            "INSERT INTO users (id, username, password, email, spouse_dob, dob, time1) VALUES ("
                    + "1, 'Jack', 'jill', 'jack@exemplars.com', NULL, '2018-12-31',"
                    + " '18:32:45'"
                    + ")";

    private static final String INSERT_USER2_QUERY =
            "INSERT INTO users (id, username, password, email, spouse_dob, dob, time1) VALUES ("
                    + "2, 'Jill', 'jack', 'jill@exemplars.com', NULL, '2019-12-31',"
                    + " '15:45:30'"
                    + ")";

    private static final String INSERT_USER3_QUERY =
            "INSERT INTO users (id, username, password, email, spouse_dob, dob, time1) VALUES ("
                    + "3, 'JackJill', 'jaji', 'jaji@exemplars.com', NULL, '2021-01-31',"
                    + " '15:45:30'"
                    + ")";

    @BeforeAll
    public static void setUp() throws SQLException {
        sharedConnectionPool = mssqlPluginExecutor
                .datasourceCreate(createDatasourceConfiguration(container))
                .block();
        createTablesForTest();
    }

    private static void createTablesForTest() throws SQLException {
        runSQLQueryOnMssqlTestDB(CREATE_USER_TABLE_QUERY, sharedConnectionPool);
        runSQLQueryOnMssqlTestDB(SET_IDENTITY_INSERT_USERS_QUERY, sharedConnectionPool);
        runSQLQueryOnMssqlTestDB(INSERT_USER1_QUERY, sharedConnectionPool);
        runSQLQueryOnMssqlTestDB(INSERT_USER2_QUERY, sharedConnectionPool);
        runSQLQueryOnMssqlTestDB(INSERT_USER3_QUERY, sharedConnectionPool);
    }

    @Test
    public void testDefaultPort() {

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(container.getHost());

        long defaultPort = MssqlPlugin.getPort(endpoint);

        assertEquals(1433L, defaultPort);
    }

    @Test
    public void testConnectMsSqlContainer() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);

        Mono<HikariDataSource> dsConnectionMono = mssqlPluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .assertNext(Assertions::assertNotNull)
                .verifyComplete();
    }

    @Test
    public void testTestDatasource_withCorrectCredentials_returnsWithoutInvalids() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);

        final Mono<DatasourceTestResult> testDatasourceMono = mssqlPluginExecutor.testDatasource(dsConfig);

        StepVerifier.create(testDatasourceMono)
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                    assertTrue(datasourceTestResult.isSuccess());
                    assertTrue(datasourceTestResult.getInvalids().isEmpty());
                })
                .verifyComplete();
    }

    @Test
    public void testAliasColumnNames() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);
        Mono<HikariDataSource> dsConnectionMono = mssqlPluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT id as user_id FROM users WHERE id = 1");

        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn ->
                mssqlPluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

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
    }

    @Test
    public void testExecute() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);
        Mono<HikariDataSource> dsConnectionMono = mssqlPluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT * FROM users WHERE id = 1");

        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn ->
                mssqlPluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

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
                            new String[] {
                                "id", "username", "password", "email", "spouse_dob", "dob", "time1",
                            },
                            new ObjectMapper()
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray());

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(
                            ACTION_CONFIGURATION_BODY, actionConfiguration.getBody(), null, null, new HashMap<>()));
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void invalidTestConnectMsSqlContainer() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);
        // Set up random username and password and try to connect
        DBAuth auth = (DBAuth) dsConfig.getAuthentication();
        auth.setUsername(UUID.randomUUID().toString());
        auth.setPassword(UUID.randomUUID().toString());

        Mono<HikariDataSource> dsConnectionMono = mssqlPluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithPluginException)
                .verify();
    }

    @Test
    void testValidateDatasource_NullCredentials_returnsWithInvalids() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);

        dsConfig.setConnection(new Connection());
        DBAuth auth = (DBAuth) dsConfig.getAuthentication();
        auth.setUsername(null);
        auth.setPassword(null);
        auth.setDatabaseName(null);

        Set<String> expectedOutput = mssqlPluginExecutor.validateDatasource(dsConfig);
        assertTrue(expectedOutput.contains(MssqlErrorMessages.DS_MISSING_USERNAME_ERROR_MSG));
        assertTrue(expectedOutput.contains(MssqlErrorMessages.DS_MISSING_PASSWORD_ERROR_MSG));
        assertTrue(expectedOutput.contains(MssqlErrorMessages.DS_MISSING_DATABASE_NAME_ERROR_MSG));
    }

    @Test
    void testValidateDatasource_NullEndPoint() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);
        dsConfig.setEndpoints(null);
        Set<String> output = mssqlPluginExecutor.validateDatasource(dsConfig);
        assertTrue(output.contains(MssqlErrorMessages.DS_MISSING_ENDPOINT_ERROR_MSG));
    }

    @Test
    void testValidateDatasource_NullHost() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);
        dsConfig.setEndpoints(List.of(new Endpoint("", 1433L)));
        Set<String> output = mssqlPluginExecutor.validateDatasource(dsConfig);
        assertTrue(output.contains(MssqlErrorMessages.DS_MISSING_HOSTNAME_ERROR_MSG));
    }

    @Test
    void testValidateDatasource_NullAuthentication() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);
        dsConfig.setAuthentication(null);
        Set<String> output = mssqlPluginExecutor.validateDatasource(dsConfig);
        assertTrue(output.contains(MssqlErrorMessages.DS_MISSING_AUTHENTICATION_DETAILS_ERROR_MSG));
    }

    @Test
    public void testPreparedStatementWithoutQuotes() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        // First test with the binding not surrounded with quotes
        actionConfiguration.setBody("SELECT * FROM users where id = {{binding1}};");

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
                mssqlPluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(pool ->
                mssqlPluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals("Jack", node.get("username").asText());
                    assertEquals("jack@exemplars.com", node.get("email").asText());
                    assertEquals("2018-12-31", node.get("dob").asText());
                    assertEquals("18:32:45.0000000", node.get("time1").asText());
                    assertTrue(node.get("spouse_dob").isNull());

                    // Check the order of the columns.
                    // Check the order of the columns.
                    assertArrayEquals(
                            new String[] {
                                "id", "username", "password", "email", "spouse_dob", "dob", "time1",
                            },
                            new ObjectMapper()
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
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT * FROM users where id = \"{{binding1}}\";");

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
                mssqlPluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(pool ->
                mssqlPluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals("Jack", node.get("username").asText());
                    assertEquals("jack@exemplars.com", node.get("email").asText());
                    assertEquals("2018-12-31", node.get("dob").asText());
                    assertEquals("18:32:45.0000000", node.get("time1").asText());
                    assertTrue(node.get("spouse_dob").isNull());

                    // Check the order of the columns.
                    assertArrayEquals(
                            new String[] {
                                "id", "username", "password", "email", "spouse_dob", "dob", "time1",
                            },
                            new ObjectMapper()
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray());

                    /*
                     * - Check if request params are sent back properly.
                     * - Not replicating the same to other tests as the overall flow remains the same w.r.t. request
                     *  params.
                     */

                    // check if '?' is replaced by $i.
                    assertEquals(
                            "SELECT * FROM users where id = $1;",
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
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT * FROM users where id = '{{binding1}}';");

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
                mssqlPluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(pool ->
                mssqlPluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals("Jack", node.get("username").asText());
                    assertEquals("jack@exemplars.com", node.get("email").asText());
                    assertEquals("2018-12-31", node.get("dob").asText());
                    assertEquals("18:32:45.0000000", node.get("time1").asText());
                    assertTrue(node.get("spouse_dob").isNull());

                    // Check the order of the columns.
                    assertArrayEquals(
                            new String[] {
                                "id", "username", "password", "email", "spouse_dob", "dob", "time1",
                            },
                            new ObjectMapper()
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray());
                })
                .verifyComplete();
    }

    @Test
    public void testPreparedStatementWithNullStringValue() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("UPDATE users set " + "username = {{binding1}}, "
                + "password = {{binding1}},\n"
                + "email = {{binding1}}"
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
                mssqlPluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(pool ->
                mssqlPluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();

        actionConfiguration.setBody("SELECT * FROM users where id = 2;");
        resultMono = connectionCreateMono.flatMap(pool ->
                mssqlPluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertTrue(node.get("username").isNull());
                    assertTrue(node.get("password").isNull());
                    assertTrue(node.get("email").isNull());
                })
                .verifyComplete();
    }

    @Test
    public void testPreparedStatementWithNullValue() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("UPDATE users set " + "username = {{binding1}}, "
                + "password = {{binding1}}, "
                + "email = {{binding1}}"
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
                mssqlPluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(pool ->
                mssqlPluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();

        actionConfiguration.setBody("SELECT * FROM users where id = 3;");
        resultMono = connectionCreateMono.flatMap(pool ->
                mssqlPluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertTrue(node.get("username").isNull());
                    assertTrue(node.get("password").isNull());
                    assertTrue(node.get("email").isNull());
                })
                .verifyComplete();
    }

    @Test
    public void testDuplicateColumnNames() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);
        Mono<HikariDataSource> dsConnectionMono = mssqlPluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT id, username as id, password, email as password FROM users WHERE id = 1");

        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn ->
                mssqlPluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    assertNotEquals(0, result.getMessages().size());

                    String expectedMessage = "Your MsSQL query result may not have all the columns because duplicate "
                            + "column names were found for the column(s)";
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
    public void testLimitQuery() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        // First test with the binding not surrounded with quotes
        actionConfiguration.setBody("SELECT TOP 10 * FROM users ORDER BY id;");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono =
                mssqlPluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(pool ->
                mssqlPluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();
    }

    @Test
    public void testNumericStringHavingLeadingZeroWithPreparedStatement() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);

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
                mssqlPluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(pool ->
                mssqlPluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
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
    public void verifyUniquenessOfMssqlPluginErrorCode() {
        assert (Arrays.stream(MssqlPluginError.values())
                        .map(MssqlPluginError::getAppErrorCode)
                        .distinct()
                        .count()
                == MssqlPluginError.values().length);

        assert (Arrays.stream(MssqlPluginError.values())
                        .map(MssqlPluginError::getAppErrorCode)
                        .filter(appErrorCode -> appErrorCode.length() != 11 || !appErrorCode.startsWith("PE-MSS"))
                        .collect(Collectors.toList())
                        .size()
                == 0);
    }

    @Test
    public void testSSLNoVerifyConnectionIsEncrypted() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String queryToFetchEncryptionStatusOfSelfConnection = "SELECT   \n" + "    c.encrypt_option \n"
                + "FROM sys.dm_exec_connections AS c  \n"
                + "JOIN sys.dm_exec_sessions AS s  \n"
                + "    ON c.session_id = s.session_id  \n"
                + "WHERE c.session_id = @@SPID;";
        actionConfiguration.setBody(queryToFetchEncryptionStatusOfSelfConnection);

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        executeActionDTO.setParams(params);

        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);
        dsConfig.getConnection().getSsl().setAuthType(SSLDetails.AuthType.NO_VERIFY);

        Mono<HikariDataSource> connectionCreateMono = mssqlPluginExecutor.datasourceCreate(dsConfig);
        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(pool ->
                mssqlPluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    String expectedResultString = "[{\"encrypt_option\":\"TRUE\"}]";
                    assertEquals(expectedResultString, result.getBody().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testSSLDisabledConnectionIsNotEncrypted() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        String queryToFetchEncryptionStatusOfSelfConnection = "SELECT   \n" + "    c.encrypt_option \n"
                + "FROM sys.dm_exec_connections AS c  \n"
                + "JOIN sys.dm_exec_sessions AS s  \n"
                + "    ON c.session_id = s.session_id  \n"
                + "WHERE c.session_id = @@SPID;";
        actionConfiguration.setBody(queryToFetchEncryptionStatusOfSelfConnection);

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        executeActionDTO.setParams(params);

        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);
        dsConfig.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DISABLE);

        Mono<HikariDataSource> connectionCreateMono = mssqlPluginExecutor.datasourceCreate(dsConfig);
        Mono<ActionExecutionResult> resultMono = connectionCreateMono.flatMap(pool ->
                mssqlPluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    String expectedResultString = "[{\"encrypt_option\":\"FALSE\"}]";
                    assertEquals(expectedResultString, result.getBody().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_endpointNotPresent_ReturnsEmptyString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);
        // setting endpoints to empty list
        dsConfig.setEndpoints(new ArrayList());

        final Mono<String> rateLimitIdentifierMono = mssqlPluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(rateLimitIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_HostAbsent_ReturnsEmptyString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("");
        dsConfig.getEndpoints().get(0).setPort(1433L);

        final Mono<String> endPointIdentifierMono = mssqlPluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_HostAndPortPresent_ReturnsCorrectString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("localhost");
        dsConfig.getEndpoints().get(0).setPort(34L);

        final Mono<String> endPointIdentifierMono = mssqlPluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("localhost_34", endpointIdentifier);
                })
                .verifyComplete();
    }

    @Test
    public void testGetEndpointIdentifierForRateLimit_HostPresentPortAbsent_ReturnsCorrectString() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);

        // Setting hostname and port
        dsConfig.getEndpoints().get(0).setHost("localhost");
        dsConfig.getEndpoints().get(0).setPort(null);

        final Mono<String> endPointIdentifierMono = mssqlPluginExecutor.getEndpointIdentifierForRateLimit(dsConfig);

        StepVerifier.create(endPointIdentifierMono)
                .assertNext(endpointIdentifier -> {
                    assertEquals("localhost_1433", endpointIdentifier);
                })
                .verifyComplete();
    }
}
