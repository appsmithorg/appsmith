package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.ParsedDataType;
import com.appsmith.external.models.SSLDetails;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mongodb.reactivestreams.client.MongoClient;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.constants.DisplayDataType.JSON;
import static com.appsmith.external.constants.DisplayDataType.RAW;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Unit tests for MongoPlugin
 */
@Testcontainers
public class MongoPluginRegexTest {
    MongoPlugin.MongoPluginExecutor pluginExecutor = new MongoPlugin.MongoPluginExecutor(ObservationRegistry.NOOP);

    private static String address;
    private static Integer port;

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

    @Test
    public void testRegexStringQueryWithSmartSubstitution() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setEncodeParamsToggle(Boolean.TRUE);

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");

        String rawFind = "{ find: \"users\", \n " + "filter: {\"name\":{$regex: \"{{appsmith.store.variable}}\"}}}";
        setDataValueSafelyInFormData(configMap, BODY, rawFind);

        actionConfiguration.setFormData(configMap);
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(List.of(new Param("appsmith.store.variable", "[a-zA-Z]{0,3}.*Ci.*")));

        Mono<ActionExecutionResult> actionExecutionResultMono = dsConnectionMono.flatMap(clientConnection ->
                pluginExecutor.executeParameterized(clientConnection, executeActionDTO, dsConfig, actionConfiguration));
        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    assertNotNull(actionExecutionResult);
                    assertTrue(actionExecutionResult.getIsExecutionSuccess());
                    assertEquals(1, ((ArrayNode) actionExecutionResult.getBody()).size());
                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            actionExecutionResult.getDataTypes().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testRegexNumberQueryWithSmartSubstitution() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setEncodeParamsToggle(Boolean.TRUE);

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");

        String rawFind =
                "{ find: \"teams\", \n " + "filter: {\"goals_allowed\":{$regex: \"{{appsmith.store.variable}}\"}}}";
        setDataValueSafelyInFormData(configMap, BODY, rawFind);

        actionConfiguration.setFormData(configMap);
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(List.of(new Param("appsmith.store.variable", "35")));

        Mono<ActionExecutionResult> actionExecutionResultMono = dsConnectionMono.flatMap(clientConnection ->
                pluginExecutor.executeParameterized(clientConnection, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    assertNotNull(actionExecutionResult);
                    assertTrue(actionExecutionResult.getIsExecutionSuccess());
                    assertEquals(1, ((ArrayNode) actionExecutionResult.getBody()).size());
                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            actionExecutionResult.getDataTypes().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testRegexStringWithNumbersQueryWithSmartSubstitution() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setEncodeParamsToggle(Boolean.TRUE);

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");

        String rawFind =
                "{ find: \"teams\", \n " + "filter: {\"best_scoreline\":{$regex: \"{{appsmith.store.variable}}\"}}}";
        setDataValueSafelyInFormData(configMap, BODY, rawFind);

        actionConfiguration.setFormData(configMap);
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(List.of(new Param("appsmith.store.variable", "5-.*")));

        Mono<ActionExecutionResult> actionExecutionResultMono = dsConnectionMono.flatMap(clientConnection ->
                pluginExecutor.executeParameterized(clientConnection, executeActionDTO, dsConfig, actionConfiguration));
        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    assertNotNull(actionExecutionResult);
                    assertTrue(actionExecutionResult.getIsExecutionSuccess());
                    System.out.println(actionExecutionResult.getBody());
                    assertEquals(1, ((ArrayNode) actionExecutionResult.getBody()).size());
                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            actionExecutionResult.getDataTypes().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testRegexNegativeNumbersQueryWithSmartSubstitution() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setEncodeParamsToggle(Boolean.TRUE);

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");

        String rawFind =
                "{ find: \"teams\", \n " + "filter: {\"goal_difference\":{$regex: \"{{appsmith.store.variable}}\"}}}";
        setDataValueSafelyInFormData(configMap, BODY, rawFind);

        actionConfiguration.setFormData(configMap);
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(List.of(new Param("appsmith.store.variable", "-7")));

        Mono<ActionExecutionResult> actionExecutionResultMono = dsConnectionMono.flatMap(clientConnection ->
                pluginExecutor.executeParameterized(clientConnection, executeActionDTO, dsConfig, actionConfiguration));
        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    assertNotNull(actionExecutionResult);
                    assertTrue(actionExecutionResult.getIsExecutionSuccess());
                    System.out.println(actionExecutionResult.getBody());
                    assertEquals(1, ((ArrayNode) actionExecutionResult.getBody()).size());
                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            actionExecutionResult.getDataTypes().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testRegexNegativeDecimalNumberQueryWithSmartSubstitution() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setEncodeParamsToggle(Boolean.TRUE);

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");

        String rawFind = "{ find: \"teams\", \n " + "filter: {\"xGD\":{$regex: \"{{appsmith.store.variable}}\"}}}";
        setDataValueSafelyInFormData(configMap, BODY, rawFind);

        actionConfiguration.setFormData(configMap);
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(List.of(new Param("appsmith.store.variable", "-2.5")));

        Mono<ActionExecutionResult> actionExecutionResultMono = dsConnectionMono.flatMap(clientConnection ->
                pluginExecutor.executeParameterized(clientConnection, executeActionDTO, dsConfig, actionConfiguration));
        StepVerifier.create(actionExecutionResultMono)
                .assertNext(actionExecutionResult -> {
                    assertNotNull(actionExecutionResult);
                    assertTrue(actionExecutionResult.getIsExecutionSuccess());
                    System.out.println(actionExecutionResult.getBody());
                    assertEquals(1, ((ArrayNode) actionExecutionResult.getBody()).size());
                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            actionExecutionResult.getDataTypes().toString());
                })
                .verifyComplete();
    }
}
