package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.ParsedDataType;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mongodb.MongoCommandException;
import com.mongodb.reactivestreams.client.MongoClient;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.Assertions;
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
import java.util.Set;

import static com.appsmith.external.constants.DisplayDataType.JSON;
import static com.appsmith.external.constants.DisplayDataType.RAW;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static com.external.plugins.utils.DatasourceUtils.KEY_HOST_PORT;
import static com.external.plugins.utils.DatasourceUtils.KEY_PASSWORD;
import static com.external.plugins.utils.DatasourceUtils.KEY_URI_DEFAULT_DBNAME;
import static com.external.plugins.utils.DatasourceUtils.KEY_URI_HEAD;
import static com.external.plugins.utils.DatasourceUtils.KEY_URI_TAIL;
import static com.external.plugins.utils.DatasourceUtils.KEY_USERNAME;
import static com.external.plugins.utils.DatasourceUtils.MONGO_URI_REGEX;
import static com.external.plugins.utils.DatasourceUtils.extractInfoFromConnectionStringURI;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

/**
 * Unit tests for MongoPlugin
 */
@Testcontainers
public class MongoPluginDatasourceTest {
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
    public void testConnectToMongo() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        StepVerifier.create(dsConnectionMono)
                .assertNext(Assertions::assertNotNull)
                .verifyComplete();
    }

    @Test
    public void testConnectToMongoWithoutUsername() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.setAuthentication(new DBAuth(DBAuth.Type.SCRAM_SHA_1, "", "", "admin"));
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        StepVerifier.create(dsConnectionMono)
                .assertNext(Assertions::assertNotNull)
                .verifyComplete();
    }

    /**
     * 1. Test "testDatasource" method in MongoPluginExecutor class.
     */
    @Test
    public void testDatasourceFail() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getEndpoints().get(0).setHost("badHost");

        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                    assertFalse(datasourceTestResult.isSuccess());
                })
                .verifyComplete();
    }

    @Test
    public void testDatasourceFailWithInvalidDefaultDatabaseName() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getConnection().setDefaultDatabaseName("abcd");
        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                    assertFalse(datasourceTestResult.isSuccess());
                })
                .verifyComplete();
    }

    @Test
    public void testDatasourceFailWithEmptyDefaultDatabaseNameAndInvalidAuthDBName() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getConnection().setDefaultDatabaseName("");
        DBAuth dbAuth = new DBAuth();
        dbAuth.setDatabaseName("abcd");
        dsConfig.setAuthentication(dbAuth);
        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                    assertTrue(datasourceTestResult.getInvalids().stream()
                            .anyMatch(error -> error.contains("Authentication database name is invalid, "
                                    + "no database found with this name.")));
                    assertFalse(datasourceTestResult.isSuccess());
                })
                .verifyComplete();
    }

    @Test
    public void testDatasourceSuccessWithEmptyDefaultDatabaseNameAndValidAuthDBName() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getConnection().setDefaultDatabaseName("");
        DBAuth dbAuth = new DBAuth();
        dbAuth.setDatabaseName("test");
        dsConfig.setAuthentication(dbAuth);
        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                    assertTrue(datasourceTestResult.isSuccess());
                })
                .verifyComplete();
    }

    /*
     * 1. Test that when a query is attempted to run on mongodb but refused because of lack of authorization.
     */
    @Test
    public void testDatasourceWithUnauthorizedException() {
        /*
         * 1. Create mock exception of type: MongoCommandException.
         *      - mock method getErrorCodeName() to return String "Unauthorized".
         */
        MongoCommandException mockMongoCommandException = mock(MongoCommandException.class);
        when(mockMongoCommandException.getErrorCodeName()).thenReturn("Unauthorized");
        when(mockMongoCommandException.getMessage()).thenReturn("Mock Unauthorized Exception");
        when(mockMongoCommandException.getErrorMessage())
                .thenReturn("Mock error  : Expected 'something' , but got something else.\n"
                        + "Doc = [{find mockAction} {filter mockFilter} {limit 10} {$db mockDB} ...]");

        /*
         * 1. Spy MongoPluginExecutor class.
         *      - On calling testDatasource(...) -> call the real method.
         *      - On calling datasourceCreate(...) -> throw the mock exception defined above.
         */
        MongoPlugin.MongoPluginExecutor mongoPluginExecutor =
                new MongoPlugin.MongoPluginExecutor(ObservationRegistry.NOOP);
        MongoPlugin.MongoPluginExecutor spyMongoPluginExecutor = spy(mongoPluginExecutor);
        /* Please check this out before modifying this line: https://stackoverflow
         * .com/questions/11620103/mockito-trying-to-spy-on-method-is-calling-the-original-method
         */
        doReturn(Mono.error(mockMongoCommandException))
                .when(spyMongoPluginExecutor)
                .datasourceCreate(any());

        /*
         * 1. Test that MongoCommandException with error code "Unauthorized" is not successful because of invalid credentials.
         */
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        StepVerifier.create(spyMongoPluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> {
                    assertFalse(datasourceTestResult.isSuccess());
                })
                .verifyComplete();
    }

    @Test
    public void testTestDatasource_withCorrectCredentials_returnsWithoutInvalids() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        DBAuth dbAuth = new DBAuth();
        dbAuth.setDatabaseName("test");
        dsConfig.setAuthentication(dbAuth);

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
    public void testTestDatasourceTimeoutError() {
        String badHost = "mongo-bad-url.mongodb.net";
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getEndpoints().get(0).setHost(badHost);

        Mono<DatasourceTestResult> datasourceTestResult = pluginExecutor.testDatasource(dsConfig);

        StepVerifier.create(datasourceTestResult)
                .assertNext(result -> {
                    assertFalse(result.isSuccess());
                    assertTrue(result.getInvalids().size() == 1);
                    assertTrue(result.getInvalids().stream()
                            .anyMatch(error -> error.contains(
                                    "Connection timed out. Please check if the datasource configuration fields have "
                                            + "been filled correctly.")));
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
                    String expectedError = "Appsmith server has failed to fetch SSL configuration from datasource "
                            + "configuration form. Please reach out to Appsmith customer support to resolve this.";
                    assertTrue(invalids.stream().anyMatch(expectedError::equals));
                })
                .verifyComplete();
    }

    @Test
    public void testSslDefault() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap,
                BODY,
                "{\n" + "      find: \"users\",\n"
                        + "      filter: { age: { $gte: 30 } },\n"
                        + "      sort: { id: 1 },\n"
                        + "      limit: 10,\n"
                        + "    }");
        actionConfiguration.setFormData(configMap);

        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(datasourceConfiguration);
        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.executeParameterized(
                conn, new ExecuteActionDTO(), datasourceConfiguration, actionConfiguration));

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
    public void testSslDisabled() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DISABLED);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap,
                BODY,
                "{\n" + "      find: \"users\",\n"
                        + "      filter: { age: { $gte: 30 } },\n"
                        + "      sort: { id: 1 },\n"
                        + "      limit: 10,\n"
                        + "    }");
        actionConfiguration.setFormData(configMap);

        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(datasourceConfiguration);
        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.executeParameterized(
                conn, new ExecuteActionDTO(), datasourceConfiguration, actionConfiguration));

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
    public void testSslEnabled() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.ENABLED);

        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap,
                BODY,
                "{\n" + "      find: \"users\",\n"
                        + "      filter: { age: { $gte: 30 } },\n"
                        + "      sort: { id: 1 },\n"
                        + "      limit: 10,\n"
                        + "    }");
        actionConfiguration.setFormData(configMap);

        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(datasourceConfiguration);
        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.executeParameterized(
                conn, new ExecuteActionDTO(), datasourceConfiguration, actionConfiguration));

        /*
         * - This test case is exactly same as the one's used in DEFAULT and DISABLED tests.
         * - Expect error here because testcontainer does not support SSL connection.
         */
        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());
                    assertEquals(AppsmithPluginError.PLUGIN_QUERY_TIMEOUT_ERROR.getTitle(), result.getTitle());
                })
                .verifyComplete();
    }

    @Test
    public void testValidateDatasource_withoutDefaultDBInURIString_returnsInvalid() {
        final DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        List<Property> properties = new ArrayList<>();
        properties.add(new Property("isUriString", "Yes"));
        properties.add(new Property("uriString", "mongodb://user:pass@url.net/"));
        datasourceConfiguration.setProperties(properties);

        final Set<String> strings = pluginExecutor.validateDatasource(datasourceConfiguration);

        assertEquals(1, strings.size());
        assertTrue(strings.contains("Missing default database name."));
    }

    @Test
    public void testURIRegexPassWithValidURIWithUsernamePassword() {
        String uri = "mongodb://user:pass@localhost:28017/mongo_samples?w=majority&retrywrites=true&authsource=admin"
                + "&minpoolsize=0";
        Map extractedInfo = extractInfoFromConnectionStringURI(uri, MONGO_URI_REGEX);
        assertEquals("mongodb://", extractedInfo.get(KEY_URI_HEAD));
        assertEquals("user", extractedInfo.get(KEY_USERNAME));
        assertEquals("pass", extractedInfo.get(KEY_PASSWORD));
        assertEquals("localhost:28017", extractedInfo.get(KEY_HOST_PORT));
        assertEquals("mongo_samples", extractedInfo.get(KEY_URI_DEFAULT_DBNAME));
        assertEquals("w=majority&retrywrites=true&authsource=admin&minpoolsize=0", extractedInfo.get(KEY_URI_TAIL));
    }

    @Test
    public void testURIRegexPassWithValidURIWithoutUsernamePassword() {
        String uri = "mongodb://@localhost:28017/mongo_samples?w=majority&retrywrites=true&authsource=admin"
                + "&minpoolsize=0";
        Map extractedInfo = extractInfoFromConnectionStringURI(uri, MONGO_URI_REGEX);
        assertEquals("mongodb://", extractedInfo.get(KEY_URI_HEAD));
        assertNull(extractedInfo.get(KEY_USERNAME));
        assertNull(extractedInfo.get(KEY_PASSWORD));
        assertEquals("localhost:28017", extractedInfo.get(KEY_HOST_PORT));
        assertEquals("mongo_samples", extractedInfo.get(KEY_URI_DEFAULT_DBNAME));
        assertEquals("w=majority&retrywrites=true&authsource=admin&minpoolsize=0", extractedInfo.get(KEY_URI_TAIL));
    }

    @Test
    public void testURIRegexPassWithValidURIWithoutAtUsernamePassword() {
        String uri = "mongodb://localhost:28017/mongo_samples?w=majority&retrywrites=true&authsource=admin"
                + "&minpoolsize=0";
        Map extractedInfo = extractInfoFromConnectionStringURI(uri, MONGO_URI_REGEX);
        assertEquals("mongodb://", extractedInfo.get(KEY_URI_HEAD));
        assertNull(extractedInfo.get(KEY_USERNAME));
        assertNull(extractedInfo.get(KEY_PASSWORD));
        assertEquals("localhost:28017", extractedInfo.get(KEY_HOST_PORT));
        assertEquals("mongo_samples", extractedInfo.get(KEY_URI_DEFAULT_DBNAME));
        assertEquals("w=majority&retrywrites=true&authsource=admin&minpoolsize=0", extractedInfo.get(KEY_URI_TAIL));
    }
}
