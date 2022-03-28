package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.PsParameterDTO;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.RequestParamDTO;
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
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
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
            new MSSQLServerContainer<>(
                    DockerImageName.parse("mcr.microsoft.com/azure-sql-edge:1.0.3").asCompatibleSubstituteFor("mcr.microsoft.com/mssql/server:2017-latest"))
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
                        "    username VARCHAR (50),\n" +
                        "    password VARCHAR (50),\n" +
                        "    email VARCHAR (355),\n" +
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

            try (Statement statement = connection.createStatement()) {
                statement.execute(
                        "INSERT INTO users (id, username, password, email, spouse_dob, dob, time1) VALUES (" +
                                "3, 'JackJill', 'jaji', 'jaji@exemplars.com', NULL, '2021-01-31'," +
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

    @Test
    public void testPreparedStatementWithoutQuotes() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

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
        params.add(param);
        executeActionDTO.setParams(params);

        Mono<Connection> connectionCreateMono = pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono
                .flatMap(pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

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

                    // Assert the debug request parameters are getting set.
                    ActionExecutionRequest request = result.getRequest();
                    List<Map.Entry<String, String>> parameters = (List<Map.Entry<String, String>>) request.getProperties().get("ps-parameters");
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
        actionConfiguration.setBody("SELECT * FROM users where id = \"{{binding1}}\";");

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

        Mono<Connection> connectionCreateMono = pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono
                .flatMap(pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

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

                    /*
                     * - Check if request params are sent back properly.
                     * - Not replicating the same to other tests as the overall flow remains the same w.r.t. request
                     *  params.
                     */

                    // check if '?' is replaced by $i.
                    assertEquals("SELECT * FROM users where id = $1;",
                            ((RequestParamDTO)(((List)result.getRequest().getRequestParams())).get(0)).getValue());

                    PsParameterDTO expectedPsParam = new PsParameterDTO("1", "INTEGER");
                    PsParameterDTO returnedPsParam =
                            (PsParameterDTO) ((RequestParamDTO) (((List) result.getRequest().getRequestParams())).get(0)).getSubstitutedParams().get("$1");
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
        actionConfiguration.setBody("SELECT * FROM users where id = '{{binding1}}';");

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

        Mono<Connection> connectionCreateMono = pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono
                .flatMap(pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

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
    public void testPreparedStatementWithNullStringValue() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("UPDATE users set " +
                "username = {{binding1}}, " +
                "password = {{binding1}},\n" +
                "email = {{binding1}}" +
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

        Mono<Connection> connectionCreateMono = pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono
                .flatMap(pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();

        actionConfiguration.setBody("SELECT * FROM users where id = 2;");
        resultMono = connectionCreateMono
                .flatMap(pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

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
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();


        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("UPDATE users set " +
                "username = {{binding1}}, " +
                "password = {{binding1}}, " +
                "email = {{binding1}}" +
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

        Mono<Connection> connectionCreateMono = pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono
                .flatMap(pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    System.out.printf("result : " + result);
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();

        actionConfiguration.setBody("SELECT * FROM users where id = 3;");
        resultMono = connectionCreateMono
                .flatMap(pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

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
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT id, username as id, password, email as password FROM users WHERE id = 1");

        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    assertNotEquals(0, result.getMessages().size());

                    String expectedMessage = "Your MsSQL query result may not have all the columns because duplicate " +
                            "column names were found for the column(s)";
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

    @Test
    public void testLimitQuery() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        // First test with the binding not surrounded with quotes
        actionConfiguration.setBody("SELECT TOP 10 * FROM users ORDER BY id;");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        executeActionDTO.setParams(params);

        Mono<Connection> connectionCreateMono = pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono
                .flatMap(pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();
    }
}
