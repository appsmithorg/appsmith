package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DatasourceConfiguration;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoDatabase;
import io.micrometer.observation.ObservationRegistry;
import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.plugins.MongoPlugin.N_MODIFIED;
import static com.external.plugins.MongoPlugin.WRITE_CONCERN_ERROR;
import static com.external.plugins.MongoPlugin.WRITE_ERRORS;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for verifying that MongoDB writeErrors and writeConcernError are properly
 * captured and returned in the execution response body and headers (Issue #7479).
 */
public class MongoPluginWriteErrorsTest {

    private MongoPlugin.MongoPluginExecutor pluginExecutor;
    private MongoClient mockClient;
    private MongoDatabase mockDatabase;
    private DatasourceConfiguration datasourceConfiguration;

    /**
     * Setup mocks and plugin executor before each test.
     */
    @BeforeEach
    public void setUp() {
        pluginExecutor = new MongoPlugin.MongoPluginExecutor(ObservationRegistry.NOOP);
        mockClient = mock(MongoClient.class);
        mockDatabase = mock(MongoDatabase.class);
        when(mockClient.getDatabase(any())).thenReturn(mockDatabase);

        datasourceConfiguration = new DatasourceConfiguration();
        Connection connection = new Connection();
        connection.setDefaultDatabaseName("testDb");
        datasourceConfiguration.setConnection(connection);
    }

    /**
     * Test that when an update command encounters write errors (e.g. attempting to alter immutable field _id),
     * the writeErrors array is included in the response body alongside nModified.
     */
    @Test
    public void testUpdateCommandIncludesWriteErrorsInResponse() {
        String mongoOutputJson = "{"
                + "\"n\": 0,"
                + "\"nModified\": 0,"
                + "\"writeErrors\": ["
                + "  {\"index\": 0, \"code\": 66, \"errmsg\": \"After applying the update, the (immutable) field '_id' was found to have been altered\"}"
                + "],"
                + "\"ok\": 1.0"
                + "}";
        Document responseDoc = Document.parse(mongoOutputJson);
        when(mockDatabase.runCommand(any())).thenReturn(Mono.just(responseDoc));

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(configMap, BODY, "{\"update\": \"users\", \"updates\": [{\"q\": {\"_id\": 1}, \"u\": {\"$set\": {\"_id\": 2}}}]}");
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeCommon(
                mockClient, datasourceConfiguration, actionConfiguration, null);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertTrue(result.getBody() instanceof ObjectNode);

                    ObjectNode body = (ObjectNode) result.getBody();
                    assertEquals(0, body.get(N_MODIFIED).asInt());
                    assertTrue(body.has(WRITE_ERRORS));

                    ArrayNode writeErrors = (ArrayNode) body.get(WRITE_ERRORS);
                    assertEquals(1, writeErrors.size());
                    assertEquals(66, writeErrors.get(0).get("code").asInt());
                    assertTrue(writeErrors.get(0).get("errmsg").asText().contains("immutable"));

                    // Verify headers also contain the writeErrors
                    assertNotNull(result.getHeaders());
                    assertTrue(result.getHeaders() instanceof ArrayNode);
                    ArrayNode headers = (ArrayNode) result.getHeaders();
                    boolean foundInHeaders = false;
                    for (int i = 0; i < headers.size(); i++) {
                        if (headers.get(i).has(WRITE_ERRORS)) {
                            foundInHeaders = true;
                            break;
                        }
                    }
                    assertTrue(foundInHeaders);
                })
                .verifyComplete();
    }

    /**
     * Test that when an update command encounters both writeErrors and a writeConcernError,
     * both are included in the response body alongside nModified.
     */
    @Test
    public void testUpdateCommandIncludesWriteErrorsAndWriteConcernError() {
        String mongoOutputJson = "{"
                + "\"n\": 0,"
                + "\"nModified\": 0,"
                + "\"writeErrors\": ["
                + "  {\"index\": 0, \"code\": 66, \"errmsg\": \"immutable field altered\"}"
                + "],"
                + "\"writeConcernError\": {"
                + "  \"code\": 64,"
                + "  \"errmsg\": \"waiting for replication timed out\""
                + "},"
                + "\"ok\": 1.0"
                + "}";
        Document responseDoc = Document.parse(mongoOutputJson);
        when(mockDatabase.runCommand(any())).thenReturn(Mono.just(responseDoc));

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(configMap, BODY, "{\"update\": \"users\", \"updates\": [{\"q\": {\"_id\": 1}, \"u\": {\"$set\": {\"_id\": 2}}}]}");
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeCommon(
                mockClient, datasourceConfiguration, actionConfiguration, null);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    ObjectNode body = (ObjectNode) result.getBody();
                    assertEquals(0, body.get(N_MODIFIED).asInt());
                    assertTrue(body.has(WRITE_ERRORS));
                    assertTrue(body.has(WRITE_CONCERN_ERROR));

                    ObjectNode writeConcern = (ObjectNode) body.get(WRITE_CONCERN_ERROR);
                    assertEquals(64, writeConcern.get("code").asInt());
                    assertEquals("waiting for replication timed out", writeConcern.get("errmsg").asText());
                })
                .verifyComplete();
    }

    /**
     * Test that when a delete command encounters write errors,
     * the writeErrors array is included in the response body alongside n.
     */
    @Test
    public void testDeleteCommandIncludesWriteErrorsInResponse() {
        String mongoOutputJson = "{"
                + "\"n\": 0,"
                + "\"writeErrors\": ["
                + "  {\"index\": 0, \"code\": 11000, \"errmsg\": \"delete write error\"}"
                + "],"
                + "\"ok\": 1.0"
                + "}";
        Document responseDoc = Document.parse(mongoOutputJson);
        when(mockDatabase.runCommand(any())).thenReturn(Mono.just(responseDoc));

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(configMap, BODY, "{\"delete\": \"users\", \"deletes\": [{\"q\": {\"_id\": 1}, \"limit\": 1}]}");
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeCommon(
                mockClient, datasourceConfiguration, actionConfiguration, null);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    ObjectNode body = (ObjectNode) result.getBody();
                    assertEquals(0, body.get("n").asInt());
                    assertTrue(body.has(WRITE_ERRORS));
                    ArrayNode writeErrors = (ArrayNode) body.get(WRITE_ERRORS);
                    assertEquals(1, writeErrors.size());
                    assertEquals(11000, writeErrors.get(0).get("code").asInt());
                })
                .verifyComplete();
    }

    /**
     * Test that when a command returns writeErrors without n or nModified keys,
     * writeErrors is still included in the response body.
     */
    @Test
    public void testCommandWithWriteErrorsWithoutNOrNModified() {
        String mongoOutputJson = "{"
                + "\"writeErrors\": ["
                + "  {\"index\": 0, \"code\": 123, \"errmsg\": \"custom write error\"}"
                + "],"
                + "\"ok\": 1.0"
                + "}";
        Document responseDoc = Document.parse(mongoOutputJson);
        when(mockDatabase.runCommand(any())).thenReturn(Mono.just(responseDoc));

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(configMap, BODY, "{\"customCommand\": 1}");
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeCommon(
                mockClient, datasourceConfiguration, actionConfiguration, null);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    ObjectNode body = (ObjectNode) result.getBody();
                    assertTrue(body.has(WRITE_ERRORS));
                    ArrayNode writeErrors = (ArrayNode) body.get(WRITE_ERRORS);
                    assertEquals(1, writeErrors.size());
                    assertEquals(123, writeErrors.get(0).get("code").asInt());
                })
                .verifyComplete();
    }

    /**
     * Test that successful update command without write errors retains existing response format
     * with nModified and does not include writeErrors key.
     */
    @Test
    public void testSuccessfulUpdateCommandHasNoWriteErrors() {
        String mongoOutputJson = "{"
                + "\"n\": 1,"
                + "\"nModified\": 1,"
                + "\"ok\": 1.0"
                + "}";
        Document responseDoc = Document.parse(mongoOutputJson);
        when(mockDatabase.runCommand(any())).thenReturn(Mono.just(responseDoc));

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(configMap, BODY, "{\"update\": \"users\", \"updates\": [{\"q\": {\"_id\": 1}, \"u\": {\"$set\": {\"name\": \"Alice\"}}}]}");
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeCommon(
                mockClient, datasourceConfiguration, actionConfiguration, null);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    ObjectNode body = (ObjectNode) result.getBody();
                    assertEquals(1, body.get(N_MODIFIED).asInt());
                    assertFalse(body.has(WRITE_ERRORS));
                    assertFalse(body.has(WRITE_CONCERN_ERROR));
                })
                .verifyComplete();
    }
}
