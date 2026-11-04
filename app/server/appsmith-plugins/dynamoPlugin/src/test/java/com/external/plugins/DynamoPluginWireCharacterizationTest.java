package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.fasterxml.jackson.databind.JsonNode;
import mockwebserver3.Dispatcher;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import mockwebserver3.RecordedRequest;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pins, for every action the query editor offers, the request the plugin sends to DynamoDB for a query body and what it
 * returns for DynamoDB's response. A local server stands in for DynamoDB: it answers each case with the case's canned
 * response and records the requests. Cases are in {@code characterization/commands.json}; their snapshots are in
 * {@code characterization/wire-golden.json}.
 */
class DynamoPluginWireCharacterizationTest {

    private static final JsonNode CASES = CharacterizationGolden.readResource("characterization/commands.json");
    private static final CharacterizationGolden GOLDEN =
            new CharacterizationGolden("wire", DynamoPluginWireCharacterizationTest.class);
    private static final DynamoPlugin.DynamoPluginExecutor EXECUTOR = new DynamoPlugin.DynamoPluginExecutor();
    private static final List<Map<String, Object>> RECEIVED = new CopyOnWriteArrayList<>();

    private static volatile JsonNode currentCase;
    private static MockWebServer server;
    private static DatasourceConfiguration datasource;
    private static DynamoDbClient client;

    @BeforeAll
    static void startServer() throws IOException {
        server = new MockWebServer();
        server.setDispatcher(new Dispatcher() {
            @Override
            public MockResponse dispatch(RecordedRequest request) {
                Map<String, Object> received = new LinkedHashMap<>();
                received.put("target", request.getHeader("X-Amz-Target"));
                received.put("body", parse(request.getBody().readUtf8()));
                RECEIVED.add(received);
                JsonNode response = currentCase.get("response");
                return new MockResponse()
                        .setResponseCode(currentCase.path("status").asInt(200))
                        .addHeader("Content-Type", "application/x-amz-json-1.0")
                        .addHeader("x-amzn-RequestId", "request-id-1")
                        .setBody(response.toString());
            }
        });
        server.start();

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(server.getHostName());
        endpoint.setPort((long) server.getPort());
        DBAuth auth = new DBAuth();
        auth.setUsername("access-key");
        auth.setPassword("secret-key");
        auth.setDatabaseName("us-east-1");
        datasource = new DatasourceConfiguration();
        datasource.setAuthentication(auth);
        datasource.setEndpoints(List.of(endpoint));
        client = EXECUTOR.datasourceCreate(datasource).block(Duration.ofSeconds(30));
    }

    @AfterAll
    static void stopServer() throws IOException {
        GOLDEN.writeActuals();
        if (client != null) {
            client.close();
        }
        server.shutdown();
    }

    static Stream<String> caseNames() {
        return StreamSupport.stream(((Iterable<String>) () -> CASES.fieldNames()).spliterator(), false);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("caseNames")
    void should_sendAndReturnCharacterizedJson_when_actionRuns(String caseName) throws IOException {
        // Given
        JsonNode testCase = CASES.get(caseName);
        currentCase = testCase;
        RECEIVED.clear();
        ActionConfiguration action = new ActionConfiguration();
        action.setPath(testCase.get("action").asText());
        JsonNode body = testCase.get("body");
        action.setBody(body == null || body.isNull() ? null : CharacterizationGolden.MAPPER.writeValueAsString(body));

        // When
        ActionExecutionResult result =
                EXECUTOR.execute(client, datasource, action).block(Duration.ofSeconds(60));

        // Then
        Map<String, Object> snapshot = new TreeMap<>();
        snapshot.put("result", CharacterizationGolden.snapshot(result, true));
        snapshot.put("requests", CharacterizationGolden.normalize(new ArrayList<>(RECEIVED), true));
        GOLDEN.assertMatches(caseName, snapshot);
    }

    @Test
    void should_haveACaseForEveryEditorAction_when_casesAreListed() {
        // Given
        JsonNode editor = CharacterizationGolden.readResource("editor.json");
        Set<String> editorActions = new HashSet<>();
        editor.findParents("configProperty").stream()
                .filter(control -> "actionConfiguration.path"
                        .equals(control.get("configProperty").asText()))
                .forEach(control -> control.get("options")
                        .forEach(option -> editorActions.add(option.get("value").asText())));

        // When
        Set<String> coveredActions = new HashSet<>();
        CASES.forEach(testCase -> coveredActions.add(testCase.get("action").asText()));

        // Then
        assertThat(coveredActions).containsAll(editorActions);
    }

    private static Object parse(String body) {
        if (body.isEmpty()) {
            return "";
        }
        try {
            return CharacterizationGolden.MAPPER.readTree(body);
        } catch (IOException e) {
            return "unparsed:" + body;
        }
    }
}
