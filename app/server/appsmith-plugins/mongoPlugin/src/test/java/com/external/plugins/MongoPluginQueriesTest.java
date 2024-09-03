package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.ParsedDataType;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.SSLDetails;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mongodb.reactivestreams.client.MongoClient;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.constants.DisplayDataType.JSON;
import static com.appsmith.external.constants.DisplayDataType.RAW;
import static com.appsmith.external.helpers.PluginUtils.OBJECT_TYPE;
import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.plugins.constants.FieldName.AGGREGATE_LIMIT;
import static com.external.plugins.constants.FieldName.AGGREGATE_PIPELINES;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.COUNT_QUERY;
import static com.external.plugins.constants.FieldName.DELETE_LIMIT;
import static com.external.plugins.constants.FieldName.DELETE_QUERY;
import static com.external.plugins.constants.FieldName.DISTINCT_KEY;
import static com.external.plugins.constants.FieldName.DISTINCT_QUERY;
import static com.external.plugins.constants.FieldName.FIND_PROJECTION;
import static com.external.plugins.constants.FieldName.FIND_QUERY;
import static com.external.plugins.constants.FieldName.FIND_SORT;
import static com.external.plugins.constants.FieldName.INSERT_DOCUMENT;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.plugins.constants.FieldName.UPDATE_OPERATION;
import static com.external.plugins.constants.FieldName.UPDATE_QUERY;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit tests for MongoPlugin
 */
@Testcontainers
public class MongoPluginQueriesTest {
    MongoPlugin.MongoPluginExecutor pluginExecutor = new MongoPlugin.MongoPluginExecutor();

    private static String address;
    private static Integer port;
    private JsonNode value;

    @SuppressWarnings("rawtypes")
    @Container
    public static MongoDBContainer mongoContainer = MongoTestDBContainerManager.getMongoDBForTest();

    @BeforeAll
    public static void setUp() {
        address = mongoContainer.getHost();
        port = mongoContainer.getFirstMappedPort();
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(address);
        endpoint.setPort(port.longValue());

        Connection connection = new Connection();
        connection.setMode(Connection.Mode.READ_WRITE);
        connection.setType(Connection.Type.DIRECT);
        connection.setDefaultDatabaseName("test");
        connection.setSsl(new SSLDetails());
        connection.getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setConnection(connection);
        dsConfig.setEndpoints(List.of(endpoint));

        return dsConfig;
    }

    /**
     * Test for DBRef after codec implementation
     */
    @Test
    public void testExecuteQueryDBRef() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap, BODY, "{\n" + "      find: \"address\",\n" + "      limit: 10,\n" + "    }");
        actionConfiguration.setFormData(configMap);

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());

                    assertEquals(2, ((ArrayNode) result.getBody()).size());

                    /*
                     * Provided Input : new DBRef("test", "users", "1")
                     * To test if we are getting the expected output after external codec implementation.
                     * Note: when the codec is removed from the MongoDBPlugin, this is found failing
                     */
                    try {
                        ObjectMapper mapper = new ObjectMapper();
                        String expectedOutputJsonString = "{\"$db\":\"test\",\"$ref\":\"users\",\"$id\":\"1\"}";
                        JsonNode outputNode = mapper.readTree(expectedOutputJsonString);
                        assertEquals(outputNode, (((ArrayNode) result.getBody()).findValue("user")));
                    } catch (JsonProcessingException e) {
                        assert false;
                    }
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteReadQuery() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap,
                BODY,
                "{\n" + "      find: \"users\",\n"
                        + "      filter: { \"age\": { \"$gte\": 30 } },\n"
                        + "      sort: { id: 1 },\n"
                        + "      limit: 10,\n"
                        + "    }");
        actionConfiguration.setFormData(configMap);

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(2, ((ArrayNode) result.getBody()).size());
                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            result.getDataTypes().toString());

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(
                            ACTION_CONFIGURATION_BODY,
                            PluginUtils.getDataValueSafelyFromFormData(
                                    actionConfiguration.getFormData(), BODY, OBJECT_TYPE),
                            null,
                            null,
                            null));
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteInvalidReadQuery() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap,
                BODY,
                "{\n" + "      find: \"users\",\n"
                        + "      filter: { $is: {} },\n"
                        + "      sort: { id: 1 },\n"
                        + "      limit: 10,\n"
                        + "    }");
        actionConfiguration.setFormData(configMap);

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertFalse(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(
                            "unknown top level operator: $is.",
                            result.getPluginErrorDetails().getDownstreamErrorMessage());
                    assertEquals(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getTitle(), result.getTitle());

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(
                            ACTION_CONFIGURATION_BODY,
                            PluginUtils.getDataValueSafelyFromFormData(
                                    actionConfiguration.getFormData(), BODY, OBJECT_TYPE),
                            null,
                            null,
                            null));
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteWriteQuery() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap,
                BODY,
                "{\n" + "      insert: \"users\",\n"
                        + "      documents: [\n"
                        + "        {\n"
                        + "          name: \"John Smith\",\n"
                        + "          email: [\"john@appsmith.com](mailto:%22john@appsmith.com)\"],\n"
                        + "          gender: \"M\",\n"
                        + "          age: \"50\",\n"
                        + "        },\n"
                        + "      ],\n"
                        + "    }");
        actionConfiguration.setFormData(configMap);

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            result.getDataTypes().toString());
                })
                .verifyComplete();

        // Clean up this newly inserted value
        configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "DELETE");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(configMap, DELETE_QUERY, "{\"name\": \"John Smith\"}");
        setDataValueSafelyInFormData(configMap, DELETE_LIMIT, "SINGLE");

        actionConfiguration.setFormData(configMap);
        // Run the delete command
        dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(
                        conn, new ExecuteActionDTO(), dsConfig, actionConfiguration))
                .block();
    }

    @Test
    public void testFindAndModify() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap,
                BODY,
                "{\n" + "  findAndModify: \"users\",\n"
                        + "  query: "
                        + "{ "
                        + "name: \"Alden Cantrell\""
                        + " },\n"
                        + "  update: { $set: { gender: \"F\" }}\n"
                        + "}");
        actionConfiguration.setFormData(configMap);

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    value = ((ObjectNode) result.getBody()).get("value");
                    assertNotNull(value);
                    assertEquals("M", value.get("gender").asText());
                    assertEquals("Alden Cantrell", value.get("name").asText());
                    assertEquals(30, value.get("age").asInt());
                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            result.getDataTypes().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testCleanUp() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap, BODY, "{\n" + "      find: \"users\",\n" + "      limit: 1,\n" + "    }");
        actionConfiguration.setFormData(configMap);

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    final ArrayNode body = (ArrayNode) result.getBody();
                    assertEquals(1, body.size());
                    final JsonNode node = body.get(0);
                    assertTrue(node.get("_id").isTextual());
                    assertTrue(node.get("luckyNumber").isNumber());
                    assertEquals("2018-12-31T00:00:00Z", node.get("dob").asText());
                    assertEquals("123456.789012", node.get("netWorth").toString());
                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            result.getDataTypes().toString());
                })
                .verifyComplete();
    }

    @SuppressWarnings("unchecked")
    @Test
    public void testStructure() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<DatasourceStructure> structureMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .flatMap(connection -> pluginExecutor.getStructure(connection, dsConfig, null));

        StepVerifier.create(structureMono)
                .assertNext(structure -> {
                    // Sort the Tables since one more table is added and to maintain sequence
                    structure
                            .getTables()
                            .sort((DatasourceStructure.Table t1, DatasourceStructure.Table t2) ->
                                    t2.getName().compareTo(t1.getName()));
                    assertNotNull(structure);
                    assertEquals(3, structure.getTables().size());

                    // now there are three tables named <users, teams, address>
                    final DatasourceStructure.Table usersTable =
                            structure.getTables().get(0);
                    assertEquals("users", usersTable.getName());
                    assertEquals(DatasourceStructure.TableType.COLLECTION, usersTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[] {
                                new DatasourceStructure.Column("_id", "ObjectId", null, true),
                                new DatasourceStructure.Column("age", "Integer", null, false),
                                new DatasourceStructure.Column("dob", "Date", null, false),
                                new DatasourceStructure.Column("gender", "String", null, false),
                                new DatasourceStructure.Column("luckyNumber", "Long", null, false),
                                new DatasourceStructure.Column("name", "String", null, false),
                                new DatasourceStructure.Column("netWorth", "BigDecimal", null, false),
                                new DatasourceStructure.Column("updatedByCommand", "Object", null, false),
                            },
                            usersTable.getColumns().toArray());

                    assertArrayEquals(
                            new DatasourceStructure.Key[] {},
                            usersTable.getKeys().toArray());
                    List<DatasourceStructure.Template> templates = usersTable.getTemplates();

                    // Assert Find command
                    DatasourceStructure.Template findTemplate = templates.get(0);
                    assertEquals("Find", findTemplate.getTitle());
                    assertEquals(
                            "{\n" + "  \"find\": \"users\",\n"
                                    + "  \"filter\": {\n"
                                    + "    \"gender\": \"F\"\n"
                                    + "  },\n"
                                    + "  \"sort\": {\n"
                                    + "    \"_id\": 1\n"
                                    + "  },\n"
                                    + "  \"limit\": 10\n"
                                    + "}\n",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) findTemplate.getConfiguration(), BODY, STRING_TYPE));
                    assertEquals(
                            "FIND",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) findTemplate.getConfiguration(), COMMAND, STRING_TYPE));

                    assertEquals(
                            "{ \"gender\": \"F\"}",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) findTemplate.getConfiguration(), FIND_QUERY, STRING_TYPE));
                    assertEquals(
                            "{\"_id\": 1}",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) findTemplate.getConfiguration(), FIND_SORT, STRING_TYPE));

                    // Assert Find By Id command
                    DatasourceStructure.Template findByIdTemplate = templates.get(1);
                    assertEquals("Find by ID", findByIdTemplate.getTitle());
                    assertEquals(
                            "{\n" + "  \"find\": \"users\",\n"
                                    + "  \"filter\": {\n"
                                    + "    \"_id\": ObjectId(\"id_to_query_with\")\n"
                                    + "  }\n"
                                    + "}\n",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) findByIdTemplate.getConfiguration(), BODY, STRING_TYPE));
                    assertEquals(
                            "FIND",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) findByIdTemplate.getConfiguration(), COMMAND, STRING_TYPE));
                    assertEquals(
                            "{\"_id\": ObjectId(\"id_to_query_with\")}",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) findByIdTemplate.getConfiguration(),
                                    FIND_QUERY,
                                    STRING_TYPE));

                    // Assert Insert command
                    DatasourceStructure.Template insertTemplate = templates.get(2);
                    assertEquals("Insert", insertTemplate.getTitle());
                    assertEquals(
                            "{\n" + "  \"insert\": \"users\",\n"
                                    + "  \"documents\": [\n"
                                    + "    {\n"
                                    + "      \"_id\": ObjectId(\"a_valid_object_id_hex\"),\n"
                                    + "      \"age\": 1,\n"
                                    + "      \"dob\": new Date(\"2019-07-01\"),\n"
                                    + "      \"gender\": \"new value\",\n"
                                    + "      \"luckyNumber\": NumberLong(\"1\"),\n"
                                    + "      \"name\": \"new value\",\n"
                                    + "      \"netWorth\": NumberDecimal(\"1\"),\n"
                                    + "      \"updatedByCommand\": {},\n"
                                    + "    }\n"
                                    + "  ]\n"
                                    + "}\n",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) insertTemplate.getConfiguration(), BODY, STRING_TYPE));
                    assertEquals(
                            "INSERT",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) insertTemplate.getConfiguration(), COMMAND, STRING_TYPE));
                    assertEquals(
                            "[{      \"_id\": ObjectId(\"a_valid_object_id_hex\"),\n" + "      \"age\": 1,\n"
                                    + "      \"dob\": new Date(\"2019-07-01\"),\n"
                                    + "      \"gender\": \"new value\",\n"
                                    + "      \"luckyNumber\": NumberLong(\"1\"),\n"
                                    + "      \"name\": \"new value\",\n"
                                    + "      \"netWorth\": NumberDecimal(\"1\"),\n"
                                    + "      \"updatedByCommand\": {},\n"
                                    + "}]",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) insertTemplate.getConfiguration(),
                                    INSERT_DOCUMENT,
                                    STRING_TYPE));

                    // Assert Update command
                    DatasourceStructure.Template updateTemplate = templates.get(3);
                    assertEquals("Update", updateTemplate.getTitle());
                    assertEquals(
                            "{\n" + "  \"update\": \"users\",\n"
                                    + "  \"updates\": [\n"
                                    + "    {\n"
                                    + "      \"q\": {\n"
                                    + "        \"_id\": ObjectId(\"id_of_document_to_update\")\n"
                                    + "      },\n"
                                    + "      \"u\": { \"$set\": { \"gender\": \"new value\" } }\n"
                                    + "    }\n"
                                    + "  ]\n"
                                    + "}\n",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) updateTemplate.getConfiguration(), BODY, STRING_TYPE));
                    assertEquals(
                            "UPDATE",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) updateTemplate.getConfiguration(), COMMAND, STRING_TYPE));
                    assertEquals(
                            "{ \"_id\": ObjectId(\"id_of_document_to_update\") }",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) updateTemplate.getConfiguration(),
                                    UPDATE_QUERY,
                                    STRING_TYPE));
                    assertEquals(
                            "{ \"$set\": { \"gender\": \"new value\" } }",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) updateTemplate.getConfiguration(),
                                    UPDATE_OPERATION,
                                    STRING_TYPE));

                    // Assert Delete Command
                    DatasourceStructure.Template deleteTemplate = templates.get(4);
                    assertEquals("Delete", deleteTemplate.getTitle());
                    assertEquals(
                            "{\n" + "  \"delete\": \"users\",\n"
                                    + "  \"deletes\": [\n"
                                    + "    {\n"
                                    + "      \"q\": {\n"
                                    + "        \"_id\": \"id_of_document_to_delete\"\n"
                                    + "      },\n"
                                    + "      \"limit\": 1\n"
                                    + "    }\n"
                                    + "  ]\n"
                                    + "}\n",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) deleteTemplate.getConfiguration(), BODY, STRING_TYPE));
                    assertEquals(
                            "DELETE",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) deleteTemplate.getConfiguration(), COMMAND, STRING_TYPE));
                    assertEquals(
                            "{ \"_id\": ObjectId(\"id_of_document_to_delete\") }",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) deleteTemplate.getConfiguration(),
                                    DELETE_QUERY,
                                    STRING_TYPE));
                    assertEquals(
                            "SINGLE",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) deleteTemplate.getConfiguration(),
                                    DELETE_LIMIT,
                                    STRING_TYPE));

                    // Assert Count Command
                    DatasourceStructure.Template countTemplate = templates.get(5);
                    assertEquals("Count", countTemplate.getTitle());
                    assertEquals(
                            "{\n" + "  \"count\": \"users\",\n"
                                    + "  \"query\": "
                                    + "{\"_id\": {\"$exists\": true}} \n" + "}\n",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) countTemplate.getConfiguration(), BODY, STRING_TYPE));
                    assertEquals(
                            "COUNT",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) countTemplate.getConfiguration(), COMMAND, STRING_TYPE));
                    assertEquals(
                            "{\"_id\": {\"$exists\": true}}",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) countTemplate.getConfiguration(), COUNT_QUERY, STRING_TYPE));

                    // Assert Distinct Command
                    DatasourceStructure.Template distinctTemplate = templates.get(6);
                    assertEquals("Distinct", distinctTemplate.getTitle());
                    assertEquals(
                            "{\n" + "  \"distinct\": \"users\",\n"
                                    + "  \"query\": { \"_id\": ObjectId(\"id_of_document_to_distinct\") },"
                                    + "  \"key\": \"_id\","
                                    + "}\n",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) distinctTemplate.getConfiguration(), BODY, STRING_TYPE));
                    assertEquals(
                            "DISTINCT",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) distinctTemplate.getConfiguration(), COMMAND, STRING_TYPE));
                    assertEquals(
                            "{ \"_id\": ObjectId(\"id_of_document_to_distinct\") }",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) distinctTemplate.getConfiguration(),
                                    DISTINCT_QUERY,
                                    STRING_TYPE));
                    assertEquals(
                            "_id",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) distinctTemplate.getConfiguration(),
                                    DISTINCT_KEY,
                                    STRING_TYPE));

                    // Assert Aggregate Command
                    DatasourceStructure.Template aggregateTemplate = templates.get(7);
                    assertEquals("Aggregate", aggregateTemplate.getTitle());
                    assertEquals(
                            "{\n" + "  \"aggregate\": \"users\",\n"
                                    + "  \"pipeline\": "
                                    + "[ {\"$sort\" : {\"_id\": 1} } ],\n" + "  \"limit\": 10,\n"
                                    + "  \"explain\": \"true\"\n"
                                    + "}\n",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) aggregateTemplate.getConfiguration(), BODY, STRING_TYPE));

                    assertEquals(
                            "AGGREGATE",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) aggregateTemplate.getConfiguration(), COMMAND, STRING_TYPE));
                    assertEquals(
                            "[ {\"$sort\" : {\"_id\": 1} } ]",
                            PluginUtils.getDataValueSafelyFromFormData(
                                    (Map<String, Object>) aggregateTemplate.getConfiguration(),
                                    AGGREGATE_PIPELINES,
                                    STRING_TYPE));
                })
                .verifyComplete();
    }

    @Test
    public void testStructure_should_return_collections_in_order() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<DatasourceStructure> structureMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .flatMap(connection -> pluginExecutor.getStructure(connection, dsConfig, null));

        StepVerifier.create(structureMono)
                .assertNext(structure -> {
                    assertNotNull(structure);
                    assertEquals(3, structure.getTables().size());

                    // Check that the tables are sorted in ascending order
                    assertEquals("address", structure.getTables().get(0).getName());
                    assertEquals("teams", structure.getTables().get(1).getName());
                    assertEquals("users", structure.getTables().get(2).getName());
                })
                .verifyComplete();
    }

    @Test
    public void testCountCommand() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "COUNT");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(configMap, COUNT_QUERY, "{}");

        actionConfiguration.setFormData(configMap);

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    JsonNode value = ((ObjectNode) result.getBody()).get("n");
                    assertEquals(value.asInt(), 3);
                })
                .verifyComplete();
    }

    @Test
    public void testDistinctCommand() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "DISTINCT");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(configMap, DISTINCT_QUERY, "{}");
        setDataValueSafelyInFormData(configMap, DISTINCT_KEY, "name");

        actionConfiguration.setFormData(configMap);

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    ArrayNode valuesNode = (ArrayNode) ((ObjectNode) result.getBody()).get("values");
                    int valuesSize = valuesNode.size();
                    assertEquals(valuesSize, 3);
                })
                .verifyComplete();
    }

    @Test
    public void testAggregateCommand() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "AGGREGATE");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(
                configMap, AGGREGATE_PIPELINES, "[ {$sort :{ _id  : 1 }}, { $project: { age : 1}}]");
        setDataValueSafelyInFormData(configMap, AGGREGATE_LIMIT, "2");

        actionConfiguration.setFormData(configMap);

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    int numOfOutputResults = ((ArrayNode) result.getBody()).size();
                    assertEquals(numOfOutputResults, 2); // This would be 3 if `LIMIT` was not set to 2.
                })
                .verifyComplete();
    }

    @Test
    public void testFindCommandProjection() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "FIND");
        setDataValueSafelyInFormData(configMap, FIND_QUERY, "{ age: { \"$gte\": 30 } }");
        setDataValueSafelyInFormData(configMap, FIND_SORT, "{ id: 1 }");
        setDataValueSafelyInFormData(configMap, FIND_PROJECTION, "{ name: 1 }");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");

        actionConfiguration.setFormData(configMap);

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        Mono<Object> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(2, ((ArrayNode) result.getBody()).size());
                    JsonNode value = ((ArrayNode) result.getBody()).get(0).get("name");
                    assertNotNull(value);
                })
                .verifyComplete();
    }
}
