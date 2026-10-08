package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;

import java.io.IOException;
import java.net.ServerSocket;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pins what the plugin returns from DynamoDB Local, end to end, on each way the server creates a client: without the
 * connection time-to-live flag, with the flag off, and with it on. Each way uses its own credentials, so DynamoDB Local
 * keeps a separate database for it and every way runs the same cases from an empty database, in order. Cases of kind
 * {@code storedBinary} read an item back with the SDK client directly and show the bytes stored for its binary values.
 * Cases are in {@code characterization/dynamodb-local.json}; their snapshots are in
 * {@code characterization/dynamodb-local-golden.json}.
 */
@Testcontainers
class DynamoPluginLocalCharacterizationTest {

    @Container
    static final GenericContainer<?> DYNAMODB_LOCAL =
            new GenericContainer<>("amazon/dynamodb-local:3.3.1").withExposedPorts(8000);

    private static final JsonNode CASES = CharacterizationGolden.readResource("characterization/dynamodb-local.json");
    private static final CharacterizationGolden GOLDEN =
            new CharacterizationGolden("dynamodb-local", DynamoPluginLocalCharacterizationTest.class);
    private static final DynamoPlugin.DynamoPluginExecutor EXECUTOR = new DynamoPlugin.DynamoPluginExecutor();
    private static final Map<DynamoClientPath, DynamoDbClient> CLIENTS = new ConcurrentHashMap<>();

    @AfterAll
    static void closeClients() {
        GOLDEN.writeActuals();
        CLIENTS.values().forEach(DynamoDbClient::close);
    }

    static Stream<Arguments> pathsAndCases() {
        List<String> names = StreamSupport.stream(CASES.spliterator(), false)
                .map(testCase -> testCase.get("name").asText())
                .toList();
        return Stream.of(DynamoClientPath.values())
                .flatMap(path -> names.stream().map(name -> Arguments.of(path, name)));
    }

    static Stream<DynamoClientPath> paths() {
        return Stream.of(DynamoClientPath.values());
    }

    @ParameterizedTest(name = "{0} {1}")
    @MethodSource("pathsAndCases")
    void should_returnCharacterizedResult_when_caseRunsAgainstDynamoDbLocal(DynamoClientPath path, String caseName)
            throws IOException {
        // Given
        JsonNode testCase = findCase(caseName);
        DatasourceConfiguration datasource = datasource(accessKey(path), DYNAMODB_LOCAL.getMappedPort(8000));
        DynamoDbClient client =
                CLIENTS.computeIfAbsent(path, key -> key.create(datasource).block(Duration.ofSeconds(30)));

        // When
        Object snapshot =
                switch (testCase.path("kind").asText("action")) {
                    case "structure" ->
                        structureSnapshot(
                                EXECUTOR.getStructure(client, datasource).block(Duration.ofSeconds(30)));
                    case "testDatasource" ->
                        testResultSnapshot(path.test(datasource).block(Duration.ofSeconds(30)));
                    case "storedBinary" -> storedBinarySnapshot(client, testCase);
                    default ->
                        CharacterizationGolden.snapshot(
                                EXECUTOR.execute(client, datasource, action(testCase))
                                        .block(Duration.ofSeconds(60)),
                                false);
                };

        // Then
        GOLDEN.assertMatches(caseName, snapshot);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("paths")
    void should_reportCharacterizedError_when_datasourceTestCannotConnect(DynamoClientPath path) throws IOException {
        // Given
        int closedPort;
        try (ServerSocket socket = new ServerSocket(0)) {
            closedPort = socket.getLocalPort();
        }
        DatasourceConfiguration datasource = datasource(accessKey(path), closedPort);

        // When
        DatasourceTestResult result = path.test(datasource).block(Duration.ofSeconds(120));

        // Then
        Map<String, Object> snapshot = testResultSnapshot(result);
        snapshot.put(
                "invalids",
                CharacterizationGolden.normalize(
                        result.getInvalids().stream()
                                .map(invalid -> invalid.replace(String.valueOf(closedPort), "<port>"))
                                // The JDK on Linux appends the OS error detail; macOS does not.
                                .map(invalid ->
                                        invalid.replace("Connection refused (connect failed)", "Connection refused"))
                                .sorted()
                                .toList(),
                        false));
        GOLDEN.assertMatches("testDatasource_connectionRefused", snapshot);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("paths")
    void should_reportCharacterizedError_when_regionIsMissing(DynamoClientPath path) {
        // Given
        DatasourceConfiguration datasource = datasource(accessKey(path), DYNAMODB_LOCAL.getMappedPort(8000));
        ((DBAuth) datasource.getAuthentication()).setDatabaseName(null);

        // When
        DatasourceTestResult result = path.test(datasource).block(Duration.ofSeconds(30));

        // Then
        GOLDEN.assertMatches("testDatasource_missingRegion", testResultSnapshot(result));
    }

    private static JsonNode findCase(String name) {
        for (JsonNode testCase : CASES) {
            if (name.equals(testCase.get("name").asText())) {
                return testCase;
            }
        }
        throw new IllegalArgumentException(name);
    }

    private static ActionConfiguration action(JsonNode testCase) throws IOException {
        ActionConfiguration action = new ActionConfiguration();
        action.setPath(testCase.get("action").asText());
        JsonNode body = testCase.get("body");
        if (testCase.has("rawBody")) {
            action.setBody(testCase.get("rawBody").asText());
        } else if (body != null && !body.isNull()) {
            action.setBody(CharacterizationGolden.MAPPER.writeValueAsString(body));
        }
        return action;
    }

    /** DynamoDB Local takes access keys of letters and digits only, and keeps one database per access key. */
    private static String accessKey(DynamoClientPath path) {
        return path.name().replace("_", "").toLowerCase();
    }

    private static DatasourceConfiguration datasource(String accessKey, int port) {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost("localhost");
        endpoint.setPort((long) port);
        DBAuth auth = new DBAuth();
        auth.setUsername(accessKey);
        auth.setPassword("secret-key");
        auth.setDatabaseName("ap-south-1");
        DatasourceConfiguration datasource = new DatasourceConfiguration();
        datasource.setAuthentication(auth);
        datasource.setEndpoints(List.of(endpoint));
        return datasource;
    }

    /**
     * The bytes DynamoDB Local stored for the binary values of the item with the case's {@code id} in its
     * {@code table}, in hex, read with the SDK client directly rather than through the plugin. Other values are kept
     * only as the structure that holds binary ones.
     */
    private static Object storedBinarySnapshot(DynamoDbClient client, JsonNode testCase) {
        Map<String, AttributeValue> item = client.getItem(GetItemRequest.builder()
                        .tableName(testCase.get("table").asText())
                        .key(Map.of(
                                "Id",
                                AttributeValue.builder()
                                        .s(testCase.get("id").asText())
                                        .build()))
                        .consistentRead(true)
                        .build())
                .item();
        Map<String, Object> snapshot = new TreeMap<>();
        item.forEach((name, value) -> snapshot.put(name, storedBinary(value)));
        return snapshot;
    }

    private static Object storedBinary(AttributeValue value) {
        if (value.b() != null) {
            return Map.of("B hex", HexFormat.of().formatHex(value.b().asByteArray()));
        }
        if (value.hasBs()) {
            return Map.of(
                    "BS hex",
                    value.bs().stream()
                            .map(bytes -> HexFormat.of().formatHex(bytes.asByteArray()))
                            .toList());
        }
        if (value.hasL()) {
            return Map.of(
                    "L",
                    value.l().stream()
                            .map(DynamoPluginLocalCharacterizationTest::storedBinary)
                            .toList());
        }
        if (value.hasM()) {
            Map<String, Object> members = new TreeMap<>();
            value.m().forEach((name, member) -> members.put(name, storedBinary(member)));
            return Map.of("M", members);
        }
        return String.valueOf(value.type());
    }

    private static Map<String, Object> structureSnapshot(DatasourceStructure structure) {
        List<Object> tables = new ArrayList<>();
        for (DatasourceStructure.Table table : structure.getTables()) {
            Map<String, Object> tableSnapshot = new TreeMap<>();
            tableSnapshot.put("type", String.valueOf(table.getType()));
            tableSnapshot.put("schema", table.getSchema());
            tableSnapshot.put("name", table.getName());
            tableSnapshot.put("columns", table.getColumns().size());
            tableSnapshot.put("keys", table.getKeys().size());
            tableSnapshot.put("templates", table.getTemplates().size());
            tables.add(tableSnapshot);
        }
        Map<String, Object> snapshot = new TreeMap<>();
        snapshot.put("tables", tables);
        snapshot.put("error", structure.getError() == null ? null : String.valueOf(structure.getError()));
        return snapshot;
    }

    private static Map<String, Object> testResultSnapshot(DatasourceTestResult result) {
        assertThat(result).isNotNull();
        Map<String, Object> snapshot = new TreeMap<>();
        snapshot.put("success", result.isSuccess());
        snapshot.put(
                "invalids",
                CharacterizationGolden.normalize(
                        result.getInvalids().stream().sorted().toList(), false));
        snapshot.put(
                "messages",
                result.getMessages() == null
                        ? null
                        : result.getMessages().stream().sorted().toList());
        return snapshot;
    }
}
