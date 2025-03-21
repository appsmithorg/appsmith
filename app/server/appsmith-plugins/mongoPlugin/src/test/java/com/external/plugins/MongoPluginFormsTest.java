package com.external.plugins;

import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.ParsedDataType;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.SSLDetails;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoClients;
import com.mongodb.reactivestreams.client.MongoCollection;
import io.micrometer.observation.ObservationRegistry;
import org.bson.Document;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.constants.DisplayDataType.JSON;
import static com.appsmith.external.constants.DisplayDataType.RAW;
import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.getDataValueSafelyFromFormData;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.plugins.constants.FieldName.AGGREGATE_PIPELINES;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.COUNT_QUERY;
import static com.external.plugins.constants.FieldName.DELETE_LIMIT;
import static com.external.plugins.constants.FieldName.DELETE_QUERY;
import static com.external.plugins.constants.FieldName.DISTINCT_KEY;
import static com.external.plugins.constants.FieldName.DISTINCT_QUERY;
import static com.external.plugins.constants.FieldName.FIND_LIMIT;
import static com.external.plugins.constants.FieldName.FIND_QUERY;
import static com.external.plugins.constants.FieldName.FIND_SORT;
import static com.external.plugins.constants.FieldName.INSERT_DOCUMENT;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.plugins.constants.FieldName.UPDATE_LIMIT;
import static com.external.plugins.constants.FieldName.UPDATE_OPERATION;
import static com.external.plugins.constants.FieldName.UPDATE_QUERY;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit tests for MongoPlugin
 */
@Testcontainers
public class MongoPluginFormsTest {
    MongoPlugin.MongoPluginExecutor pluginExecutor = new MongoPlugin.MongoPluginExecutor(ObservationRegistry.NOOP);

    private static String address;
    private static Integer port;
    private JsonNode value;
    private static MongoClient mongoClient;

    @SuppressWarnings("rawtypes")
    @Container
    public static MongoDBContainer mongoContainer = MongoTestDBContainerManager.getMongoDBForTest();

    @BeforeAll
    public static void setUp() {
        address = mongoContainer.getHost();
        port = mongoContainer.getFirstMappedPort();
        String uri = "mongodb://" + address + ":" + port;
        mongoClient = MongoClients.create(uri);
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

    @Test
    public void testBsonSmartSubstitution_withBSONValue() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap,
                BODY,
                "{\n" + "      find: {{Input4.text}},\n"
                        + "      filter: \"{{Input1.text}}\",\n"
                        + "      sort: { id: {{Input2.text}} },\n"
                        + "      limit: {{Input3.text}}\n"
                        + "    }");
        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue("{ age: { \"$gte\": 30 } }");
        param1.setClientDataType(ClientDataType.OBJECT);
        params.add(param1);
        Param param3 = new Param();
        param3.setKey("Input2.text");
        param3.setValue("1");
        param3.setClientDataType(ClientDataType.NUMBER);
        params.add(param3);
        Param param4 = new Param();
        param4.setKey("Input3.text");
        param4.setValue("10");
        param4.setClientDataType(ClientDataType.NUMBER);
        params.add(param4);
        Param param5 = new Param();
        param5.setKey("Input4.text");
        param5.setValue("users");
        param5.setClientDataType(ClientDataType.STRING);
        params.add(param5);
        executeActionDTO.setParams(params);

        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(datasourceConfiguration);
        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.executeParameterized(
                conn, executeActionDTO, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(2, ((ArrayNode) result.getBody()).size());

                    // Assert the debug request parameters are getting set.
                    ActionExecutionRequest request = result.getRequest();
                    List<Map.Entry<String, String>> parameters = (List<Map.Entry<String, String>>)
                            request.getProperties().get("smart-substitution-parameters");
                    assertEquals(parameters.size(), 4);

                    Map.Entry<String, String> parameterEntry = parameters.get(0);
                    assertEquals(parameterEntry.getKey(), "users");
                    assertEquals(parameterEntry.getValue(), "STRING");

                    parameterEntry = parameters.get(1);
                    assertEquals(parameterEntry.getKey(), "{ age: { \"$gte\": 30 } }");
                    assertEquals(parameterEntry.getValue(), "BSON");

                    parameterEntry = parameters.get(2);
                    assertEquals(parameterEntry.getKey(), "1");
                    assertEquals(parameterEntry.getValue(), "INTEGER");

                    parameterEntry = parameters.get(3);
                    assertEquals(parameterEntry.getKey(), "10");
                    assertEquals(parameterEntry.getValue(), "INTEGER");

                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            result.getDataTypes().toString());

                    String expectedQuery = "{\n" + "      find: \"users\",\n"
                            + "      filter: { age: { \"$gte\": 30 } },\n"
                            + "      sort: { id: 1 },\n"
                            + "      limit: 10\n"
                            + "    }";
                    // check that bindings are not replaced with actual values and not '$i' or '?'
                    assertEquals(
                            expectedQuery,
                            ((RequestParamDTO) (((List) result.getRequest().getRequestParams())).get(0)).getValue());
                })
                .verifyComplete();
    }

    @Test
    public void testBsonSmartSubstitution_withEscapedStringValue() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap,
                BODY,
                "{\n" + "      find: {{Input4.text}},\n"
                        + "      filter: { age: { {{Input1.text}} : 30 } },\n"
                        + "      sort: { id: {{Input2.text}} },\n"
                        + "      limit: {{Input3.text}}\n"
                        + "    }");
        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue("$gte");
        param1.setClientDataType(ClientDataType.STRING);
        params.add(param1);
        Param param3 = new Param();
        param3.setKey("Input2.text");
        param3.setValue("1");
        param3.setClientDataType(ClientDataType.NUMBER);
        params.add(param3);
        Param param4 = new Param();
        param4.setKey("Input3.text");
        param4.setValue("10");
        param4.setClientDataType(ClientDataType.NUMBER);
        params.add(param4);
        Param param5 = new Param();
        param5.setKey("Input4.text");
        param5.setValue("users");
        param5.setClientDataType(ClientDataType.STRING);
        params.add(param5);
        executeActionDTO.setParams(params);

        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(datasourceConfiguration);
        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.executeParameterized(
                conn, executeActionDTO, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(2, ((ArrayNode) result.getBody()).size());

                    // Assert the debug request parameters are getting set.
                    ActionExecutionRequest request = result.getRequest();
                    List<Map.Entry<String, String>> parameters = (List<Map.Entry<String, String>>)
                            request.getProperties().get("smart-substitution-parameters");
                    assertEquals(parameters.size(), 4);

                    Map.Entry<String, String> parameterEntry = parameters.get(0);
                    assertEquals(parameterEntry.getKey(), "users");
                    assertEquals(parameterEntry.getValue(), "STRING");

                    parameterEntry = parameters.get(1);
                    assertEquals(parameterEntry.getKey(), "$gte");
                    assertEquals(parameterEntry.getValue(), "STRING");

                    parameterEntry = parameters.get(2);
                    assertEquals(parameterEntry.getKey(), "1");
                    assertEquals(parameterEntry.getValue(), "INTEGER");

                    parameterEntry = parameters.get(3);
                    assertEquals(parameterEntry.getKey(), "10");
                    assertEquals(parameterEntry.getValue(), "INTEGER");

                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            result.getDataTypes().toString());

                    String expectedQuery = "{\n" + "      find: \"users\",\n"
                            + "      filter: { age: { \"$gte\" : 30 } },\n"
                            + "      sort: { id: 1 },\n"
                            + "      limit: 10\n"
                            + "    }";
                    // check that bindings are not replaced with actual values and not '$i' or '?'
                    assertEquals(
                            expectedQuery,
                            ((RequestParamDTO) (((List) result.getRequest().getRequestParams())).get(0)).getValue());
                })
                .verifyComplete();
    }

    @Test
    public void testFindFormCommand() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "FIND");
        setDataValueSafelyInFormData(configMap, FIND_QUERY, "{ age: { \"$gte\": 30 } }");
        setDataValueSafelyInFormData(configMap, FIND_SORT, "{ id: 1 }");
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
                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            result.getDataTypes().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testInsertFormCommandArrayDocuments() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "INSERT");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(
                configMap,
                INSERT_DOCUMENT,
                "[{name : \"ZZZ Insert Form Array Test 1\", gender : \"F\", age : 40, tag : \"test\"},"
                        + "{name : \"ZZZ Insert Form Array Test 2\", gender : \"F\", age : 40, tag : \"test\"}"
                        + "]");

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
        setDataValueSafelyInFormData(configMap, DELETE_QUERY, "{\"tag\" : \"test\"}");
        setDataValueSafelyInFormData(configMap, DELETE_LIMIT, "ALL");

        actionConfiguration.setFormData(configMap);
        // Run the delete command
        dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(
                        conn, new ExecuteActionDTO(), dsConfig, actionConfiguration))
                .block();
    }

    @Test
    public void testInsertFormCommandSingleDocument() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "INSERT");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(
                configMap,
                INSERT_DOCUMENT,
                "{\"name\" : \"ZZZ Insert Form Single Test\", \"gender\" : \"F\", \"age\" : 40, \"tag\" : \"test\"}");

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
        setDataValueSafelyInFormData(configMap, DELETE_QUERY, "{\"tag\" : \"test\"}");
        setDataValueSafelyInFormData(configMap, DELETE_LIMIT, "ALL");

        actionConfiguration.setFormData(configMap);

        // Run the delete command
        dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(
                        conn, new ExecuteActionDTO(), dsConfig, actionConfiguration))
                .block();
    }

    @Test
    public void testUpdateOneFormCommand() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "UPDATE");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(configMap, UPDATE_QUERY, "{ name: \"Alden Cantrell\" }");
        setDataValueSafelyInFormData(configMap, UPDATE_OPERATION, "{ $set: { age: 31 }}}");
        setDataValueSafelyInFormData(configMap, UPDATE_LIMIT, "SINGLE");

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
                    JsonNode value = ((ObjectNode) result.getBody()).get("nModified");
                    assertEquals(value.asText(), "1");
                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            result.getDataTypes().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testUpdateManyFormCommand() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "UPDATE");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        // Query for all the documents in the collection
        setDataValueSafelyInFormData(configMap, UPDATE_QUERY, "{}");
        setDataValueSafelyInFormData(configMap, UPDATE_OPERATION, "{ $set: { updatedByCommand: true }}}");
        setDataValueSafelyInFormData(configMap, UPDATE_LIMIT, "ALL");

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
                    JsonNode value = ((ObjectNode) result.getBody()).get("nModified");
                    assertEquals("3", value.asText());
                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            result.getDataTypes().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testUpdateManyFormCommandWithArrayInput() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "UPDATE");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        // Query for all the documents in the collection
        setDataValueSafelyInFormData(configMap, UPDATE_QUERY, "{}");
        setDataValueSafelyInFormData(
                configMap,
                UPDATE_OPERATION,
                "[{ \"$set\": { \"department\": \"app\" } }" + ",{ \"$set\": { \"department\": \"design\" } }]");
        setDataValueSafelyInFormData(configMap, UPDATE_LIMIT, "ALL");

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
                    JsonNode value = ((ObjectNode) result.getBody()).get("nModified");
                    assertEquals("3", value.asText());
                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            result.getDataTypes().toString());
                })
                .verifyComplete();

        // After update fetching to document to verify if the value is updated properly
        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        Map<String, Object> configMap1 = new HashMap<>();
        setDataValueSafelyInFormData(configMap1, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap1, COMMAND, "FIND");
        setDataValueSafelyInFormData(configMap1, COLLECTION, "users");
        // Query for all the documents in the collection
        setDataValueSafelyInFormData(configMap1, FIND_QUERY, "{\"department\":\"design\"}");
        actionConfiguration1.setFormData(configMap1);
        Mono<Object> executeMono1 = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration1));
        StepVerifier.create(executeMono1)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    int value = ((ArrayNode) result.getBody()).size();
                    assertEquals(3, value);
                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            result.getDataTypes().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testDeleteFormCommandSingleDocument() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        // Insert multiple documents which would match the delete criterion
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "INSERT");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(
                configMap,
                INSERT_DOCUMENT,
                "[{\"name\" : \"To Delete1\", \"tag\" : \"delete\"}, {\"name\" : \"To Delete2\", \"tag\" : \"delete\"}]");

        actionConfiguration.setFormData(configMap);

        dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(
                        conn, new ExecuteActionDTO(), dsConfig, actionConfiguration))
                .block();

        // Now that the documents have been inserted, lets delete one of them
        configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "DELETE");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(configMap, DELETE_QUERY, "{tag : \"delete\"}");
        setDataValueSafelyInFormData(configMap, DELETE_LIMIT, "SINGLE");

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
                    // Assert that only one document out of the two gets deleted
                    assertEquals(value.asInt(), 1);
                })
                .verifyComplete();

        // Run this delete command again to ensure that both the documents added are
        // deleted post this test.
        dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(
                        conn, new ExecuteActionDTO(), dsConfig, actionConfiguration))
                .block();
    }

    @Test
    public void testDeleteFormCommandMultipleDocument() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        // Insert multiple documents which would match the delete criterion
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "INSERT");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(
                configMap,
                INSERT_DOCUMENT,
                "[{\"name\" : \"To Delete1\", \"tag\" : \"delete\"}, {\"name\" : \"To Delete2\", \"tag\" : \"delete\"}]");

        actionConfiguration.setFormData(configMap);

        dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(
                        conn, new ExecuteActionDTO(), dsConfig, actionConfiguration))
                .block();

        // Now that the documents have been inserted, lets delete both of them
        configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "DELETE");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(configMap, DELETE_QUERY, "{tag : \"delete\"}");
        setDataValueSafelyInFormData(configMap, DELETE_LIMIT, "ALL");

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
                    assertEquals(value.asInt(), 2);
                })
                .verifyComplete();
    }

    @Test
    public void testBsonSmartSubstitutionMongoForm() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "FIND");
        setDataValueSafelyInFormData(configMap, FIND_QUERY, "\"{{Input1.text}}\"");
        setDataValueSafelyInFormData(configMap, FIND_SORT, "{ id: {{Input2.text}} }");
        setDataValueSafelyInFormData(configMap, FIND_LIMIT, "{{Input3.text}}");
        setDataValueSafelyInFormData(configMap, COLLECTION, "{{Input4.text}}");

        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue("{ age: { \"$gte\": 30 } }");
        param1.setClientDataType(ClientDataType.OBJECT);
        params.add(param1);
        Param param3 = new Param();
        param3.setKey("Input2.text");
        param3.setValue("1");
        param3.setClientDataType(ClientDataType.NUMBER);
        params.add(param3);
        Param param4 = new Param();
        param4.setKey("Input3.text");
        param4.setValue("10");
        param4.setClientDataType(ClientDataType.NUMBER);
        params.add(param4);
        Param param5 = new Param();
        param5.setKey("Input4.text");
        param5.setValue("users");
        param5.setClientDataType(ClientDataType.STRING);
        params.add(param5);
        executeActionDTO.setParams(params);

        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(datasourceConfiguration);
        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.executeParameterized(
                conn, executeActionDTO, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(2, ((ArrayNode) result.getBody()).size());

                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            result.getDataTypes().toString());

                    String expectedQuery =
                            "{\"find\": \"users\", \"filter\": {\"age\": {\"$gte\": 30}}, \"sort\": {\"id\": 1}, \"limit\": 10, \"batchSize\": 10}";
                    assertEquals(
                            expectedQuery,
                            ((RequestParamDTO) (((List) result.getRequest().getRequestParams())).get(0)).getValue());
                })
                .verifyComplete();
    }

    @Test
    public void testFormSmartInputFind() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "FIND");
        // Skip adding the query
        setDataValueSafelyInFormData(configMap, FIND_SORT, "{ id: {{Input2.text}} }");
        // Skip adding limit
        setDataValueSafelyInFormData(configMap, COLLECTION, "{{Input4.text}}");

        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input2.text");
        param1.setValue("1");
        param1.setClientDataType(ClientDataType.NUMBER);
        params.add(param1);
        Param param2 = new Param();
        param2.setKey("Input4.text");
        param2.setValue("users");
        param2.setClientDataType(ClientDataType.STRING);
        params.add(param2);
        executeActionDTO.setParams(params);

        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(datasourceConfiguration);
        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.executeParameterized(
                conn, executeActionDTO, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(3, ((ArrayNode) result.getBody()).size());

                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            result.getDataTypes().toString());

                    String expectedQuery =
                            "{\"find\": \"users\", \"filter\": {}, \"sort\": {\"id\": 1}, \"limit\": 10, \"batchSize\": 10}";
                    assertEquals(
                            expectedQuery,
                            ((RequestParamDTO) (((List) result.getRequest().getRequestParams())).get(0)).getValue());
                })
                .verifyComplete();
    }

    @Test
    public void testFormSmartInputCount() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "COUNT");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        // Skip adding the query

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
    public void testFormSmartInputDistinct() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "DISTINCT");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        // Skip adding the query
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
    public void testSmartSubstitutionEvaluatedValueContainingQuestionMark() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "INSERT");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(
                configMap,
                INSERT_DOCUMENT,
                "{\"name\" : {{Input1.text}}, \"gender\" : {{Input2.text}}, \"age\" : 40, \"tag\" : \"test\"}");

        actionConfiguration.setFormData(configMap);

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue("This string contains ? symbol");
        params.add(param1);
        Param param3 = new Param();
        param3.setKey("Input2.text");
        param3.setValue("F");
        params.add(param3);
        executeActionDTO.setParams(params);

        Mono<Object> executeMono = dsConnectionMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));
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
        setDataValueSafelyInFormData(configMap, DELETE_QUERY, "{\"tag\" : \"test\"}");
        setDataValueSafelyInFormData(configMap, DELETE_LIMIT, "ALL");

        actionConfiguration.setFormData(configMap);

        // Run the delete command
        dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(
                        conn, new ExecuteActionDTO(), dsConfig, actionConfiguration))
                .block();
    }

    @Test
    public void testSmartSubstitutionWithObjectIdInDoubleQuotes() {
        final MongoCollection<Document> usersCollection =
                mongoClient.getDatabase("test").getCollection("users");
        List<String> documentIds = new ArrayList<>();
        Flux.from(usersCollection.find())
                .map(doc -> documentIds.add(doc.get("_id").toString()))
                .collectList()
                .block();

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        String findQuery = "{\n" + "   \"find\": \"users\",\n"
                + "   \"filter\": {\n"
                + "           \"_id\": {\n"
                + "               $in: {{Input1.text}}\n"
                + "            }\n"
                + "    }\n"
                + "}";
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        StringBuilder sb = new StringBuilder();
        documentIds.stream().forEach(id -> sb.append(" \"ObjectId(\\\"" + id + "\\\")\","));
        sb.setLength(sb.length() - 1);
        String objectIdsAsArray = "[" + sb + "]";

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(configMap, BODY, findQuery);
        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue(objectIdsAsArray);
        params.add(param1);
        executeActionDTO.setParams(params);

        Mono<Object> executeMono = dsConnectionMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(3, ((ArrayNode) result.getBody()).size());
                })
                .verifyComplete();
    }

    @Test
    public void testSmartSubstitutionWithObjectIdInSingleQuotes() {
        final MongoCollection<Document> usersCollection =
                mongoClient.getDatabase("test").getCollection("users");
        List<String> documentIds = new ArrayList<>();
        Flux.from(usersCollection.find())
                .map(doc -> documentIds.add(doc.get("_id").toString()))
                .collectList()
                .block();

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        String findQuery = "{\n" + "   \"find\": \"users\",\n"
                + "   \"filter\": {\n"
                + "           \"_id\": {\n"
                + "               $in: {{Input1.text}}\n"
                + "            }\n"
                + "    }\n"
                + "}";
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        StringBuilder sb = new StringBuilder();
        documentIds.stream().forEach(id -> sb.append(" \'ObjectId(\\\"" + id + "\\\")\',"));
        sb.setLength(sb.length() - 1);
        String objectIdsAsArray = "[" + sb + "]";

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(configMap, BODY, findQuery);
        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue(objectIdsAsArray);
        param1.setClientDataType(ClientDataType.ARRAY);
        param1.setDataTypesOfArrayElements(List.of(ClientDataType.OBJECT));
        params.add(param1);
        executeActionDTO.setParams(params);

        Mono<Object> executeMono = dsConnectionMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(3, ((ArrayNode) result.getBody()).size());
                })
                .verifyComplete();
    }

    @Test
    public void testFormToNativeQueryConversionForFindCommand() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "FIND");
        setDataValueSafelyInFormData(configMap, FIND_QUERY, "{{Input1.text}}");
        setDataValueSafelyInFormData(configMap, FIND_SORT, "{ id: 1 }");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue("{ age: { \"$gte\": 30 } }");
        params.add(param1);
        executeActionDTO.setParams(params);

        pluginExecutor.extractAndSetNativeQueryFromFormData(actionConfiguration);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap, BODY, getDataValueSafelyFromFormData(configMap, "misc.formToNativeQuery", STRING_TYPE));

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        Mono<Object> executeMono = dsConnectionMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));
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
                })
                .verifyComplete();
    }

    @Test
    public void testFormToNativeQueryConversionForInsertCommand() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "INSERT");
        setDataValueSafelyInFormData(configMap, COLLECTION, "{{Input1.text}}");
        setDataValueSafelyInFormData(
                configMap,
                INSERT_DOCUMENT,
                "[{name : \"ZZZ Insert Form Array Test 1\", gender : "
                        + "\"F\", age : 40, tag : \"test\"}, {name : \"ZZZ Insert Form Array Test 2\", gender : \"F\", age : "
                        + "40, tag : \"test\"}]");

        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue("users");
        params.add(param1);
        executeActionDTO.setParams(params);

        pluginExecutor.extractAndSetNativeQueryFromFormData(actionConfiguration);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap, BODY, getDataValueSafelyFromFormData(configMap, "misc.formToNativeQuery", STRING_TYPE));

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        Mono<Object> executeMono = dsConnectionMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));
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
        setDataValueSafelyInFormData(configMap, DELETE_QUERY, "{\"tag\" : \"test\"}");
        setDataValueSafelyInFormData(configMap, DELETE_LIMIT, "ALL");

        actionConfiguration.setFormData(configMap);
        // Run the delete command
        dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(
                        conn, new ExecuteActionDTO(), dsConfig, actionConfiguration))
                .block();
    }

    @Test
    public void testFormToNativeQueryConversionForUpdateCommand() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "UPDATE");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        // Query for all the documents in the collection
        setDataValueSafelyInFormData(configMap, UPDATE_QUERY, "{}");
        setDataValueSafelyInFormData(configMap, UPDATE_OPERATION, "{{Input1.text}}");
        setDataValueSafelyInFormData(configMap, UPDATE_LIMIT, "ALL");
        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue("{ $set: { \"updatedByCommand\": false }}");
        params.add(param1);
        executeActionDTO.setParams(params);

        pluginExecutor.extractAndSetNativeQueryFromFormData(actionConfiguration);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap, BODY, getDataValueSafelyFromFormData(configMap, "misc.formToNativeQuery", STRING_TYPE));

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        Mono<Object> executeMono = dsConnectionMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    JsonNode value = ((ObjectNode) result.getBody()).get("nModified");
                    assertEquals("3", value.asText());
                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            result.getDataTypes().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testFormToNativeQueryConversionForDeleteCommand() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        // Insert multiple documents which would match the delete criterion
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "INSERT");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(
                configMap,
                INSERT_DOCUMENT,
                "[{\"name\" : \"To Delete1\", \"tag\" : \"delete\"}, "
                        + "{\"name\" : \"To Delete2\", \"tag\" : \"delete\"}]");

        actionConfiguration.setFormData(configMap);

        dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(
                        conn, new ExecuteActionDTO(), dsConfig, actionConfiguration))
                .block();

        // Now that the documents have been inserted, lets delete both of them
        configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "DELETE");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(configMap, DELETE_QUERY, "{{Input1.text}}");
        setDataValueSafelyInFormData(configMap, DELETE_LIMIT, "ALL");
        setDataValueSafelyInFormData(configMap, BODY, "");
        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue("{tag : \"delete\"}");
        params.add(param1);
        executeActionDTO.setParams(params);

        pluginExecutor.extractAndSetNativeQueryFromFormData(actionConfiguration);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap, BODY, getDataValueSafelyFromFormData(configMap, "misc.formToNativeQuery", STRING_TYPE));

        Mono<Object> executeMono = dsConnectionMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    JsonNode value = ((ObjectNode) result.getBody()).get("n");
                    assertEquals(value.asInt(), 2);
                })
                .verifyComplete();
    }

    @Test
    public void testFormToNativeQueryConversionForCountCommand() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "COUNT");
        setDataValueSafelyInFormData(configMap, COLLECTION, "{{Input1.text}}");
        setDataValueSafelyInFormData(configMap, COUNT_QUERY, "{}");
        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue("users");
        params.add(param1);
        executeActionDTO.setParams(params);

        pluginExecutor.extractAndSetNativeQueryFromFormData(actionConfiguration);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap, BODY, getDataValueSafelyFromFormData(configMap, "misc.formToNativeQuery", STRING_TYPE));

        Mono<Object> executeMono = dsConnectionMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));
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
    public void testFormToNativeQueryConversionForDistinctCommand() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "DISTINCT");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(configMap, DISTINCT_QUERY, "{}");
        setDataValueSafelyInFormData(configMap, DISTINCT_KEY, "{{Input1.text}}");
        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue("name");
        params.add(param1);
        executeActionDTO.setParams(params);

        pluginExecutor.extractAndSetNativeQueryFromFormData(actionConfiguration);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap, BODY, getDataValueSafelyFromFormData(configMap, "misc.formToNativeQuery", STRING_TYPE));

        Mono<Object> executeMono = dsConnectionMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));
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
    public void testFormToNativeQueryConversionForAggregateCommand() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "AGGREGATE");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(configMap, AGGREGATE_PIPELINES, "{{Input1.text}}");
        actionConfiguration.setFormData(configMap);

        pluginExecutor.extractAndSetNativeQueryFromFormData(actionConfiguration);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap, BODY, getDataValueSafelyFromFormData(configMap, "misc.formToNativeQuery", STRING_TYPE));

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue("[ {$sort :{ _id  : 1 }}, { $project: { age : 1}}, {$count: \"userCount\"} ]");
        params.add(param1);
        executeActionDTO.setParams(params);

        Mono<Object> executeMono = dsConnectionMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    JsonNode value = ((ArrayNode) result.getBody()).get(0).get("userCount");
                    assertEquals(value.asInt(), 3);
                })
                .verifyComplete();
    }

    @Test
    public void testSmartSubstitutionWithMongoTypesWithRawCommand1() {
        final MongoCollection<Document> usersCollection =
                mongoClient.getDatabase("test").getCollection("users");
        List<String> documentIds = new ArrayList<>();
        Flux.from(usersCollection.find())
                .filter(doc -> doc.containsKey("aLong"))
                .map(doc -> documentIds.add(doc.get("_id").toString()))
                .collectList()
                .block();

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        final String findQuery = "" + "{\n"
                + "   \"find\": \"users\",\n"
                + "   \"filter\": {\n"
                + "       \"_id\":{ $in: {{Input0}} },\n"
                + "       \"dob\":{ $in: {{Input1}} },\n"
                + "       \"netWorth\":{ $in: {{Input2}} },\n"
                + "       \"aLong\": {{Input3}},\n"
                + "       \"ts\":{ $in: {{Input4}} },\n"
                + "   },\n"
                + "}";

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(configMap, BODY, findQuery);
        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        final List<Param> params = new ArrayList<>();
        final Param id = new Param("Input0", "[\"ObjectId('" + documentIds.get(0) + "')\"]");
        id.setClientDataType(ClientDataType.ARRAY);
        id.setDataTypesOfArrayElements(List.of(ClientDataType.OBJECT));
        params.add(id);
        final Param dob = new Param("Input1", "[\"ISODate('1970-01-01T00:00:00.000Z')\"]");
        dob.setClientDataType(ClientDataType.ARRAY);
        dob.setDataTypesOfArrayElements(List.of(ClientDataType.OBJECT));
        params.add(dob);
        final Param netWorth = new Param("Input2", "['NumberDecimal(\"123456.789012\")']");
        netWorth.setClientDataType(ClientDataType.ARRAY);
        netWorth.setDataTypesOfArrayElements(List.of(ClientDataType.OBJECT));
        params.add(netWorth);
        final Param aLong = new Param("Input3", "\"NumberLong(9000000000000000000)\"");
        aLong.setClientDataType(ClientDataType.OBJECT);
        params.add(aLong);
        final Param ts = new Param("Input4", "[\"Timestamp(1421006159, 4)\"]");
        ts.setClientDataType(ClientDataType.ARRAY);
        ts.setDataTypesOfArrayElements(List.of(ClientDataType.OBJECT));
        params.add(ts);
        executeActionDTO.setParams(params);

        Mono<Object> executeMono = dsConnectionMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(1, ((ArrayNode) result.getBody()).size());
                })
                .verifyComplete();
    }

    @Test
    public void testBsonSmartSubstitutionWithMongoTypesWithFindCommand() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "FIND");
        setDataValueSafelyInFormData(configMap, FIND_QUERY, "\"{{Input1.text}}\"");
        setDataValueSafelyInFormData(configMap, FIND_SORT, "{ id: {{Input2.text}} }");
        setDataValueSafelyInFormData(configMap, FIND_LIMIT, "{{Input3.text}}");
        setDataValueSafelyInFormData(configMap, COLLECTION, "{{Input4.text}}");

        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue("{ " + "\"dob\": { \"$gte\": \"ISODate('2000-01-01T00:00:00.000Z')\" }, "
                + "\"netWorth\": { \"$in\": [\"NumberDecimal(123456.789012)\"] } "
                + "}");
        param1.setClientDataType(ClientDataType.OBJECT);
        params.add(param1);
        Param param3 = new Param();
        param3.setKey("Input2.text");
        param3.setValue("1");
        param3.setClientDataType(ClientDataType.NUMBER);
        params.add(param3);
        Param param4 = new Param();
        param4.setKey("Input3.text");
        param4.setValue("10");
        param4.setClientDataType(ClientDataType.NUMBER);
        params.add(param4);
        Param param5 = new Param();
        param5.setKey("Input4.text");
        param5.setValue("users");
        param5.setClientDataType(ClientDataType.STRING);
        params.add(param5);
        executeActionDTO.setParams(params);

        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(datasourceConfiguration);
        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.executeParameterized(
                conn, executeActionDTO, datasourceConfiguration, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(1, ((ArrayNode) result.getBody()).size());
                })
                .verifyComplete();
    }

    @Test
    public void testSmartSubstitutionWithMongoTypes2() {
        final MongoCollection<Document> usersCollection =
                mongoClient.getDatabase("test").getCollection("users");
        List<String> documentIds = new ArrayList<>();
        Flux.from(usersCollection.find())
                .filter(doc -> doc.containsKey("aLong"))
                .map(doc -> documentIds.add(doc.get("_id").toString()))
                .collectList()
                .block();

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        final String findQuery = "" + "{\n"
                + "   \"find\": \"users\",\n"
                + "   \"filter\": {\n"
                + "       \"_id\": {{Input0}},\n"
                + "       \"dob\": {{Input1}},\n"
                + "       \"netWorth\": {{Input2}},\n"
                + "       \"aLong\": {{Input3}},\n"
                + "       \"ts\": {{Input4}},\n"
                + "   },\n"
                + "}";

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(configMap, BODY, findQuery);
        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        final List<Param> params = new ArrayList<>();
        final Param id = new Param("Input0", "\"ObjectId(\\\"" + documentIds.get(0) + "\\\")\"");
        params.add(id);
        final Param dob = new Param("Input1", "\"ISODate(\\\"1970-01-01T00:00:00.000Z\\\")\"");
        params.add(dob);
        final Param netWorth = new Param("Input2", "\"NumberDecimal(\\\"123456.789012\\\")\"");
        params.add(netWorth);
        final Param aLong = new Param("Input3", "\"NumberLong(9000000000000000000)\"");
        params.add(aLong);
        final Param ts = new Param("Input4", "\"Timestamp(1421006159, 4)\"");
        params.add(ts);
        executeActionDTO.setParams(params);

        Mono<Object> executeMono = dsConnectionMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(1, ((ArrayNode) result.getBody()).size());
                })
                .verifyComplete();
    }

    @Test
    public void testSmartSubstitutionWithMongoTypes3() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        final String findQuery = "" + "{\n" + "   \"find\": \"users\",\n" + "   \"filter\": {{Input1}}\n" + "}";

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(configMap, BODY, findQuery);
        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        final List<Param> params = new ArrayList<>();
        final Param dob = new Param("Input1", "{\"dob\": \"ISODate(\\\"1970-01-01T00:00:00.000Z\\\")\"}");
        params.add(dob);
        executeActionDTO.setParams(params);

        Mono<Object> executeMono = dsConnectionMono.flatMap(
                conn -> pluginExecutor.executeParameterized(conn, executeActionDTO, dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(1, ((ArrayNode) result.getBody()).size());
                })
                .verifyComplete();
    }
}
