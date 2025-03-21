package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.ParsedDataType;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.external.plugins.exceptions.MongoPluginError;
import com.external.plugins.exceptions.MongoPluginErrorMessages;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mongodb.MongoCommandException;
import com.mongodb.MongoSecurityException;
import com.mongodb.reactivestreams.client.ListCollectionNamesPublisher;
import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoDatabase;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.reactivestreams.Subscriber;
import org.reactivestreams.Subscription;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.DisplayDataType.JSON;
import static com.appsmith.external.constants.DisplayDataType.RAW;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.plugins.constants.FieldName.AGGREGATE_LIMIT;
import static com.external.plugins.constants.FieldName.AGGREGATE_PIPELINES;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COLLECTION;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.DELETE_LIMIT;
import static com.external.plugins.constants.FieldName.DELETE_QUERY;
import static com.external.plugins.constants.FieldName.FIND_QUERY;
import static com.external.plugins.constants.FieldName.FIND_SORT;
import static com.external.plugins.constants.FieldName.INSERT_DOCUMENT;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

/**
 * Unit tests for MongoPlugin
 */
@Testcontainers
public class MongoPluginErrorsTest {
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
    public void testErrorMessageOnSrvUriWithFormInterface() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getEndpoints().get(0).setHost("mongodb+srv://user:pass@url.net/dbName");
        dsConfig.setProperties(List.of(new Property("Import from URI", "No")));
        Mono<Set<String>> invalidsMono = Mono.just(pluginExecutor.validateDatasource(dsConfig));

        StepVerifier.create(invalidsMono)
                .assertNext(invalids -> {
                    assertTrue(invalids.stream()
                            .anyMatch(error -> error.contains("It seems that you are trying to use a mongo connection"
                                    + " string URI. Please extract relevant fields and fill the form with extracted "
                                    + "values. For details, please check out the Appsmith's documentation for Mongo "
                                    + "database. Alternatively, you may use 'Import from connection string URI' option "
                                    + "from the dropdown labelled 'Use mongo connection string URI' to use the URI "
                                    + "connection string directly.")));
                })
                .verifyComplete();
    }

    @Test
    public void testErrorMessageOnNonSrvUri() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        List<Endpoint> endpoints = new ArrayList<>();
        endpoints.add(new Endpoint("url", 123L));
        endpoints.add(null);
        endpoints.add(new Endpoint(null, 123L));
        endpoints.add(new Endpoint("mongodb://user:pass@url.net:1234,url.net:1234/dbName", 123L));
        dsConfig.setEndpoints(endpoints);
        dsConfig.setProperties(List.of(new Property("Import from URI", "No")));
        Mono<Set<String>> invalidsMono = Mono.just(pluginExecutor.validateDatasource(dsConfig));

        StepVerifier.create(invalidsMono)
                .assertNext(invalids -> {
                    assertTrue(invalids.stream()
                            .anyMatch(error -> error.contains("It seems that you are trying to use a mongo connection"
                                    + " string URI. Please extract relevant fields and fill the form with extracted "
                                    + "values. For details, please check out the Appsmith's documentation for Mongo "
                                    + "database. Alternatively, you may use 'Import from connection string URI' option "
                                    + "from the dropdown labelled 'Use mongo connection string URI' to use the URI "
                                    + "connection string directly.")));
                })
                .verifyComplete();
    }

    @Test
    public void testInvalidsOnMissingUri() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.setProperties(List.of(new Property("Import from URI", "Yes")));
        Mono<Set<String>> invalidsMono = Mono.just(pluginExecutor.validateDatasource(dsConfig));

        StepVerifier.create(invalidsMono)
                .assertNext(invalids -> {
                    assertTrue(
                            invalids.stream()
                                    .anyMatch(
                                            error -> error.contains(
                                                    "'Mongo Connection string URI' field is empty. Please "
                                                            + "edit the 'Mongo Connection URI' field to provide a connection uri to connect with.")));
                })
                .verifyComplete();
    }

    @Test
    public void testInvalidsOnBadSrvUriFormat() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        List<Property> properties = new ArrayList<>();
        properties.add(new Property("Import from URI", "Yes"));
        properties.add(new Property("Srv Url", "mongodb+srv::username:password//url.net"));
        dsConfig.setProperties(properties);
        Mono<Set<String>> invalidsMono = Mono.just(pluginExecutor.validateDatasource(dsConfig));

        StepVerifier.create(invalidsMono)
                .assertNext(invalids -> {
                    assertTrue(invalids.stream()
                            .anyMatch(error -> error.contains("Mongo Connection string URI does not seem to be in the"
                                    + " correct format. Please check the URI once.")));
                })
                .verifyComplete();
    }

    @Test
    public void testInvalidsOnBadNonSrvUriFormat() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        List<Property> properties = new ArrayList<>();
        properties.add(new Property("Import from URI", "Yes"));
        properties.add(new Property("Srv Url", "mongodb::username:password//url.net"));
        dsConfig.setProperties(properties);
        Mono<Set<String>> invalidsMono = Mono.just(pluginExecutor.validateDatasource(dsConfig));

        StepVerifier.create(invalidsMono)
                .assertNext(invalids -> {
                    assertTrue(invalids.stream()
                            .anyMatch(error -> error.contains("Mongo Connection string URI does not seem to be in the"
                                    + " correct format. Please check the URI once.")));
                })
                .verifyComplete();
    }

    @Test
    public void testInvalidsEmptyOnCorrectSrvUriFormat() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        List<Property> properties = new ArrayList<>();
        properties.add(new Property("Import from URI", "Yes"));
        properties.add(new Property("Srv Url", "mongodb+srv://username:password@url.net/dbname"));
        dsConfig.setProperties(properties);
        Mono<Set<String>> invalidsMono = Mono.just(pluginExecutor.validateDatasource(dsConfig));

        StepVerifier.create(invalidsMono)
                .assertNext(invalids -> {
                    assertTrue(invalids.isEmpty());
                })
                .verifyComplete();
    }

    @Test
    public void testInvalidsEmptyOnCorrectNonSrvUriFormat() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        List<Property> properties = new ArrayList<>();
        properties.add(new Property("Import from URI", "Yes"));
        properties.add(new Property("Srv Url", "mongodb://username:password@url-1.net:1234,url-2:1234/dbname"));
        dsConfig.setProperties(properties);
        Mono<Set<String>> invalidsMono = Mono.just(pluginExecutor.validateDatasource(dsConfig));

        StepVerifier.create(invalidsMono)
                .assertNext(invalids -> {
                    assertTrue(invalids.isEmpty());
                })
                .verifyComplete();
    }

    @Test
    public void testGetStructureReadPermissionError() {
        MongoClient mockConnection = mock(MongoClient.class);
        MongoDatabase mockDatabase = mock(MongoDatabase.class);
        when(mockConnection.getDatabase(any())).thenReturn(mockDatabase);

        MongoCommandException mockMongoCmdException = mock(MongoCommandException.class);
        // Mock the ListCollectionNamesPublisher
        ListCollectionNamesPublisher mockPublisher = mock(ListCollectionNamesPublisher.class);

        // Create a mock subscription
        Subscription mockSubscription = mock(Subscription.class);

        // Simulate an error when calling listCollectionNames
        when(mockDatabase.listCollectionNames()).thenReturn(mockPublisher);
        when(mockMongoCmdException.getErrorCode()).thenReturn(13);
        // Mock the subscribe method to simulate an error
        doAnswer(invocation -> {
                    // Extract the Subscriber passed to the subscribe method
                    Subscriber<?> subscriber = invocation.getArgument(0);

                    subscriber.onSubscribe(mockSubscription); // Provide a subscription
                    // Call the Subscriber's onError method to simulate an error
                    subscriber.onError(mockMongoCmdException);

                    return null; // Since subscribe returns void
                })
                .when(mockPublisher)
                .subscribe(any());

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<DatasourceStructure> structureMono = pluginExecutor
                .datasourceCreate(dsConfig)
                .flatMap(connection -> pluginExecutor.getStructure(mockConnection, dsConfig, null));

        StepVerifier.create(structureMono).verifyErrorSatisfies(error -> {
            assertTrue(error instanceof AppsmithPluginException);
            String expectedMessage = "Appsmith has failed to get database structure. Please provide read permission on"
                    + " the database to fix this.";
            assertTrue(expectedMessage.equals(error.getMessage()));
        });
    }

    @Test
    public void testReadableErrorWithFilterKeyError() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        // Set bad attribute for limit key
        setDataValueSafelyInFormData(
                configMap,
                BODY,
                "{\n" + "      find: \"users\",\n" + "      filter: \"filter\",\n" + "      limit: 10,\n" + "    }");
        actionConfiguration.setFormData(configMap);

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertFalse(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());

                    // Verify readable error.
                    String expectedReadableError = "'filter' field must be of BSON type object.";
                    assertEquals(expectedReadableError, result.getReadableError());
                })
                .verifyComplete();
    }

    @Test
    public void testReadableErrorWithMongoFailedToParseError() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        // Set bad attribute for limit key
        setDataValueSafelyInFormData(
                configMap, BODY, "{\n" + "      find: \"users\",\n" + "      limit: [10],\n" + "    }");
        actionConfiguration.setFormData(configMap);

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertFalse(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());

                    // Verify readable error.
                    String expectedReadableError = "'limit' field must be numeric.";
                    assertEquals(expectedReadableError, result.getReadableError());
                })
                .verifyComplete();
    }

    @Test
    public void testReadableErrorWithMongoBadKeyError() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        // Set unrecognized key limitx
        setDataValueSafelyInFormData(
                configMap, BODY, "{\n" + "      find: \"users\",\n" + "      limitx: 10,\n" + "    }");
        actionConfiguration.setFormData(configMap);

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertFalse(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());

                    // Verify readable error.
                    String expectedReadableError = "Unrecognized field 'limitx'.";
                    assertEquals(expectedReadableError, result.getReadableError());
                })
                .verifyComplete();
    }

    @Test
    public void testReadableErrorOnTestDatasourceFailWithBadCredentials() {
        // Mock exception on authentication failure.
        MongoSecurityException mockMongoSecurityException = mock(MongoSecurityException.class);
        when(mockMongoSecurityException.getCode()).thenReturn(-4);
        when(mockMongoSecurityException.getMessage())
                .thenReturn("Exception authenticating "
                        + "MongoCredential{mechanism=SCRAM-SHA-1, userName='username', source='admin', password=<hidden>,"
                        + " mechanismProperties=<hidden>}");

        // Throw mock error on datasource create method call.
        MongoPlugin.MongoPluginExecutor spyMongoPluginExecutor = spy(pluginExecutor);
        doReturn(Mono.error(mockMongoSecurityException))
                .when(spyMongoPluginExecutor)
                .datasourceCreate(any());

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        StepVerifier.create(spyMongoPluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                    assertFalse(datasourceTestResult.isSuccess());

                    // Verify readable error.
                    String expectedReadableError = "Exception authenticating MongoCredential.";
                    assertEquals(
                            expectedReadableError,
                            datasourceTestResult.getInvalids().toArray()[0]);
                })
                .verifyComplete();
    }

    @Test
    public void testAggregateCommandWithInvalidQuery() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "AGGREGATE");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        // Invalid JSON object (issue: #5326)
        setDataValueSafelyInFormData(configMap, AGGREGATE_PIPELINES, "{$sort :{ _id  : 1 }}abcd");
        setDataValueSafelyInFormData(configMap, AGGREGATE_LIMIT, "2");

        actionConfiguration.setFormData(configMap);

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .expectErrorMatches(throwable -> {
                    boolean sameClass = throwable.getClass().equals(AppsmithPluginException.class);
                    if (sameClass) {
                        var ape = ((AppsmithPluginException) throwable);
                        return ape.getError().equals(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR)
                                && ape.getArgs()[0].equals(MongoPluginErrorMessages.PIPELINE_STAGE_NOT_VALID_ERROR_MSG);
                    }
                    return false;
                })
                .verify();
    }

    @Test
    public void testInsertAndFindInvalidDatetime() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "INSERT");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(
                configMap,
                INSERT_DOCUMENT,
                "[\n" + "      {\n"
                        + "        \"name\": {\n"
                        + "          \"first\": \"John\",\n"
                        + "          \"last\": \"Backus\"\n"
                        + "        },\n"
                        + "        \"birth\": ISODate(\"0001-01-01T00:00:00.000+00:00\"),\n"
                        + "        \"death\": ISODate(\"2007-03-17T04:00:00Z\"),\n"
                        + "        \"issue\": 13285\n"
                        + "      },\n"
                        + "      {\n"
                        + "        \"name\": {\n"
                        + "          \"first\": \"John\",\n"
                        + "          \"last\": \"McCarthy\"\n"
                        + "        },\n"
                        + "        \"birth\": ISODate(\"1927-09-04T04:00:00Z\"),\n"
                        + "        \"death\": ISODate(\"2011-12-24T05:00:00Z\"),\n"
                        + "        \"issue\": 13285\n"
                        + "      },\n"
                        + "      {\n"
                        + "        \"name\": {\n"
                        + "          \"first\": \"Grace\",\n"
                        + "          \"last\": \"Hopper\"\n"
                        + "        },\n"
                        + "        \"title\": \"Rear Admiral\",\n"
                        + "        \"birth\": ISODate(\"1906-12-09T05:00:00Z\"),\n"
                        + "        \"death\": ISODate(\"1992-01-01T05:00:00Z\"),\n"
                        + "        \"issue\": 13285\n"
                        + "      },\n"
                        + "      {\n"
                        + "        \"name\": {\n"
                        + "          \"first\": \"Kristen\",\n"
                        + "          \"last\": \"Nygaard\"\n"
                        + "        },\n"
                        + "        \"birth\": ISODate(\"1926-08-27T04:00:00Z\"),\n"
                        + "        \"death\": ISODate(\"2002-08-10T04:00:00Z\"),\n"
                        + "        \"issue\": 13285\n"
                        + "      }\n"
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

        // Find query
        configMap.clear();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "FIND");
        setDataValueSafelyInFormData(configMap, FIND_QUERY, "{ \"issue\": 13285}");
        setDataValueSafelyInFormData(configMap, FIND_SORT, "{ id: 1 }");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");

        actionConfiguration.setFormData(configMap);

        executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(4, ((ArrayNode) result.getBody()).size());
                    assertEquals(
                            List.of(new ParsedDataType(JSON), new ParsedDataType(RAW))
                                    .toString(),
                            result.getDataTypes().toString());
                })
                .verifyComplete();

        // Clean up this newly inserted values
        configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.FALSE);
        setDataValueSafelyInFormData(configMap, COMMAND, "DELETE");
        setDataValueSafelyInFormData(configMap, COLLECTION, "users");
        setDataValueSafelyInFormData(configMap, DELETE_QUERY, "{ \"issue\": 13285}");
        setDataValueSafelyInFormData(configMap, DELETE_LIMIT, "ALL");

        actionConfiguration.setFormData(configMap);
        // Run the delete command
        dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(
                        conn, new ExecuteActionDTO(), dsConfig, actionConfiguration))
                .block();
    }

    @Test
    public void verifyUniquenessOfMongoPluginErrorCode() {
        assert (Arrays.stream(MongoPluginError.values())
                        .map(MongoPluginError::getAppErrorCode)
                        .distinct()
                        .count()
                == MongoPluginError.values().length);

        assert (Arrays.stream(MongoPluginError.values())
                        .map(MongoPluginError::getAppErrorCode)
                        .filter(appErrorCode -> appErrorCode.length() != 11 || !appErrorCode.startsWith("PE-MNG"))
                        .collect(Collectors.toList())
                        .size()
                == 0);
    }
}
