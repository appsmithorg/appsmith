package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import mockwebserver3.RecordedRequest;
import okhttp3.Headers;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SeaTablePluginTest {

    private static MockWebServer mockWebServer;
    private static String serverUrl;
    private static final SeaTablePlugin.SeaTablePluginExecutor pluginExecutor =
            new SeaTablePlugin.SeaTablePluginExecutor();
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static final String ACCESS_TOKEN_RESPONSE = """
            {
                "app_name": "test",
                "access_token": "test-access-token-123",
                "dtable_uuid": "test-uuid-456",
                "dtable_server": "%s/",
                "dtable_name": "Test Base",
                "workspace_id": 1,
                "use_api_gateway": true
            }
            """;

    private static final String LIST_ROWS_RESPONSE = """
            {
                "rows": [
                    {
                        "_id": "row1",
                        "Name": "Alice",
                        "Age": 30
                    },
                    {
                        "_id": "row2",
                        "Name": "Bob",
                        "Age": 25
                    }
                ]
            }
            """;

    private static final String GET_ROW_RESPONSE = """
            {
                "_id": "row1",
                "Name": "Alice",
                "Age": 30
            }
            """;

    private static final String CREATE_ROW_RESPONSE = """
            {
                "inserted_row_count": 1,
                "row_ids": [{"_id": "new-row-id"}],
                "first_row": {
                    "_id": "new-row-id",
                    "Name": "Charlie",
                    "Age": 35
                }
            }
            """;

    private static final String UPDATE_ROW_RESPONSE = """
            {
                "success": true
            }
            """;

    private static final String DELETE_ROW_RESPONSE = """
            {
                "success": true
            }
            """;

    private static final String METADATA_RESPONSE = """
            {
                "metadata": {
                    "tables": [
                        {
                            "name": "Contacts",
                            "columns": [
                                {"name": "Name", "type": "text", "key": "0000"},
                                {"name": "Email", "type": "text", "key": "0001"},
                                {"name": "Age", "type": "number", "key": "0002"},
                                {"name": "Active", "type": "checkbox", "key": "0003"}
                            ]
                        },
                        {
                            "name": "Projects",
                            "columns": [
                                {"name": "Title", "type": "text", "key": "0010"},
                                {"name": "Status", "type": "single-select", "key": "0011"}
                            ]
                        }
                    ]
                }
            }
            """;

    private static final String SQL_RESPONSE = """
            {
                "results": [
                    {"Name": "Alice", "Age": 30},
                    {"Name": "Bob", "Age": 25}
                ],
                "metadata": [
                    {"key": "0000", "name": "Name", "type": "text"},
                    {"key": "0002", "name": "Age", "type": "number"}
                ]
            }
            """;

    @BeforeAll
    static void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();
        serverUrl = "http://localhost:" + mockWebServer.getPort();
    }

    @AfterAll
    static void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    private DatasourceConfiguration createDatasourceConfig() {
        DatasourceConfiguration config = new DatasourceConfiguration();
        config.setUrl(serverUrl);
        DBAuth auth = new DBAuth();
        auth.setPassword("test-api-token");
        config.setAuthentication(auth);
        return config;
    }

    private ActionConfiguration createActionConfig(String command) {
        return createActionConfig(command, new HashMap<>());
    }

    private ActionConfiguration createActionConfig(String command, Map<String, Object> extraFormData) {
        ActionConfiguration config = new ActionConfiguration();
        Map<String, Object> formData = new HashMap<>();
        setDataValueSafelyInFormData(formData, "command", command);
        extraFormData.forEach((k, v) -> setDataValueSafelyInFormData(formData, k, v));
        config.setFormData(formData);
        return config;
    }

    private void enqueueAccessTokenResponse() {
        // dtable_server in real SeaTable points to the api-gateway, e.g. https://cloud.seatable.io/api-gateway/
        // In tests we point it back to our mock server to intercept all subsequent calls.
        String response = String.format(ACCESS_TOKEN_RESPONSE, serverUrl);
        mockWebServer.enqueue(new MockResponse.Builder()
                .addHeader("Content-Type", "application/json")
                .body(response)
                .build());
    }

    // --- Validation Tests ---

    @Test
    void testValidateDatasource_missingUrl() {
        DatasourceConfiguration config = new DatasourceConfiguration();
        DBAuth auth = new DBAuth();
        auth.setPassword("some-token");
        config.setAuthentication(auth);

        Set<String> invalids = pluginExecutor.validateDatasource(config);
        assertTrue(invalids.contains("Missing SeaTable server URL."));
    }

    @Test
    void testValidateDatasource_invalidUrl() {
        DatasourceConfiguration config = new DatasourceConfiguration();
        config.setUrl("not-a-url");
        DBAuth auth = new DBAuth();
        auth.setPassword("some-token");
        config.setAuthentication(auth);

        Set<String> invalids = pluginExecutor.validateDatasource(config);
        assertTrue(invalids.contains("Invalid server URL. The URL should start with http:// or https://."));
    }

    @Test
    void testValidateDatasource_missingToken() {
        DatasourceConfiguration config = new DatasourceConfiguration();
        config.setUrl("https://cloud.seatable.io");

        Set<String> invalids = pluginExecutor.validateDatasource(config);
        assertTrue(invalids.contains("Missing SeaTable API token."));
    }

    @Test
    void testValidateDatasource_validConfig() {
        DatasourceConfiguration config = createDatasourceConfig();
        Set<String> invalids = pluginExecutor.validateDatasource(config);
        assertTrue(invalids.isEmpty());
    }

    // --- Connection Test ---

    @Test
    void testTestDatasource_success() {
        enqueueAccessTokenResponse();

        Mono<DatasourceTestResult> resultMono = pluginExecutor.testDatasource(createDatasourceConfig());

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getInvalids().isEmpty());
                })
                .verifyComplete();
    }

    @Test
    void testTestDatasource_invalidToken() {
        mockWebServer.enqueue(new MockResponse.Builder()
                .code(401)
                .body("{\"detail\": \"Invalid token\"}")
                .build());

        Mono<DatasourceTestResult> resultMono = pluginExecutor.testDatasource(createDatasourceConfig());

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertNotNull(result);
                    assertFalse(result.getInvalids().isEmpty());
                })
                .verifyComplete();
    }

    // --- List Rows ---

    @Test
    void testListRows() {
        enqueueAccessTokenResponse();
        mockWebServer.enqueue(new MockResponse.Builder()
                .addHeader("Content-Type", "application/json")
                .body(LIST_ROWS_RESPONSE)
                .build());

        Map<String, Object> extra = new HashMap<>();
        extra.put("tableName", "Contacts");
        extra.put("limit", "100");

        ActionConfiguration actionConfig = createActionConfig("LIST_ROWS", extra);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                null, new ExecuteActionDTO(), createDatasourceConfig(), actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                })
                .verifyComplete();
    }

    // --- Get Row ---

    @Test
    void testGetRow() {
        enqueueAccessTokenResponse();
        mockWebServer.enqueue(new MockResponse.Builder()
                .addHeader("Content-Type", "application/json")
                .body(GET_ROW_RESPONSE)
                .build());

        Map<String, Object> extra = new HashMap<>();
        extra.put("tableName", "Contacts");
        extra.put("rowId", "row1");

        ActionConfiguration actionConfig = createActionConfig("GET_ROW", extra);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                null, new ExecuteActionDTO(), createDatasourceConfig(), actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                })
                .verifyComplete();
    }

    // --- Create Row ---

    @Test
    void testCreateRow() {
        enqueueAccessTokenResponse();
        mockWebServer.enqueue(new MockResponse.Builder()
                .addHeader("Content-Type", "application/json")
                .body(CREATE_ROW_RESPONSE)
                .build());

        Map<String, Object> extra = new HashMap<>();
        extra.put("tableName", "Contacts");
        extra.put("body", "{\"Name\": \"Charlie\", \"Age\": 35}");

        ActionConfiguration actionConfig = createActionConfig("CREATE_ROW", extra);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                null, new ExecuteActionDTO(), createDatasourceConfig(), actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                })
                .verifyComplete();
    }

    // --- Update Row ---

    @Test
    void testUpdateRow() {
        enqueueAccessTokenResponse();
        mockWebServer.enqueue(new MockResponse.Builder()
                .addHeader("Content-Type", "application/json")
                .body(UPDATE_ROW_RESPONSE)
                .build());

        Map<String, Object> extra = new HashMap<>();
        extra.put("tableName", "Contacts");
        extra.put("rowId", "row1");
        extra.put("body", "{\"Age\": 31}");

        ActionConfiguration actionConfig = createActionConfig("UPDATE_ROW", extra);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                null, new ExecuteActionDTO(), createDatasourceConfig(), actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();
    }

    // --- Delete Row ---

    @Test
    void testDeleteRow() {
        enqueueAccessTokenResponse();
        mockWebServer.enqueue(new MockResponse.Builder()
                .addHeader("Content-Type", "application/json")
                .body(DELETE_ROW_RESPONSE)
                .build());

        Map<String, Object> extra = new HashMap<>();
        extra.put("tableName", "Contacts");
        extra.put("rowId", "row1");

        ActionConfiguration actionConfig = createActionConfig("DELETE_ROW", extra);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                null, new ExecuteActionDTO(), createDatasourceConfig(), actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();
    }

    // --- List Tables ---

    @Test
    void testListTables() {
        enqueueAccessTokenResponse();
        mockWebServer.enqueue(new MockResponse.Builder()
                .addHeader("Content-Type", "application/json")
                .body(METADATA_RESPONSE)
                .build());

        ActionConfiguration actionConfig = createActionConfig("LIST_TABLES");

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                null, new ExecuteActionDTO(), createDatasourceConfig(), actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                })
                .verifyComplete();
    }

    // --- SQL Query ---

    @Test
    void testSqlQuery() {
        enqueueAccessTokenResponse();
        mockWebServer.enqueue(new MockResponse.Builder()
                .addHeader("Content-Type", "application/json")
                .body(SQL_RESPONSE)
                .build());

        Map<String, Object> extra = new HashMap<>();
        extra.put("sql", "SELECT Name, Age FROM Contacts WHERE Age > 20");

        ActionConfiguration actionConfig = createActionConfig("SQL_QUERY", extra);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                null, new ExecuteActionDTO(), createDatasourceConfig(), actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                })
                .verifyComplete();
    }

    // --- Get Structure (Schema Discovery) ---

    @Test
    void testGetStructure() {
        enqueueAccessTokenResponse();
        mockWebServer.enqueue(new MockResponse.Builder()
                .addHeader("Content-Type", "application/json")
                .body(METADATA_RESPONSE)
                .build());

        Mono<DatasourceStructure> structureMono =
                pluginExecutor.getStructure(null, createDatasourceConfig());

        StepVerifier.create(structureMono)
                .assertNext(structure -> {
                    assertNotNull(structure);
                    assertNotNull(structure.getTables());
                    assertEquals(2, structure.getTables().size());

                    DatasourceStructure.Table contactsTable = structure.getTables().get(0);
                    assertEquals("Contacts", contactsTable.getName());
                    assertEquals(4, contactsTable.getColumns().size());
                    assertEquals("Name", contactsTable.getColumns().get(0).getName());
                    assertEquals("text", contactsTable.getColumns().get(0).getType());

                    DatasourceStructure.Table projectsTable = structure.getTables().get(1);
                    assertEquals("Projects", projectsTable.getName());
                    assertEquals(2, projectsTable.getColumns().size());
                })
                .verifyComplete();
    }

    // --- Missing Parameters ---

    @Test
    void testMissingCommand() {
        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setFormData(new HashMap<>());

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                null, new ExecuteActionDTO(), createDatasourceConfig(), actionConfig);

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> e instanceof AppsmithPluginException
                        && e.getMessage().contains("Missing command"))
                .verify();
    }

    @Test
    void testListRows_missingTableName() {
        enqueueAccessTokenResponse();

        ActionConfiguration actionConfig = createActionConfig("LIST_ROWS");

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                null, new ExecuteActionDTO(), createDatasourceConfig(), actionConfig);

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> e instanceof AppsmithPluginException
                        && e.getMessage().contains("Missing table name"))
                .verify();
    }

    @Test
    void testGetRow_missingRowId() {
        enqueueAccessTokenResponse();

        Map<String, Object> extra = new HashMap<>();
        extra.put("tableName", "Contacts");

        ActionConfiguration actionConfig = createActionConfig("GET_ROW", extra);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                null, new ExecuteActionDTO(), createDatasourceConfig(), actionConfig);

        StepVerifier.create(resultMono)
                .expectErrorMatches(e -> e instanceof AppsmithPluginException
                        && e.getMessage().contains("Missing row ID"))
                .verify();
    }
}
