package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.PaginationField;
import com.appsmith.util.SerializationUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import com.google.cloud.NoCredentials;
import com.google.cloud.ServiceOptions;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.Blob;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.cloud.firestore.GeoPoint;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.testcontainers.containers.FirestoreEmulatorContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.constants.FieldName.BODY;
import static com.external.constants.FieldName.CHILDREN;
import static com.external.constants.FieldName.COMMAND;
import static com.external.constants.FieldName.LIMIT_DOCUMENTS;
import static com.external.constants.FieldName.NEXT;
import static com.external.constants.FieldName.ORDER_BY;
import static com.external.constants.FieldName.PATH;
import static com.external.constants.FieldName.TIMESTAMP_VALUE_PATH;
import static com.external.constants.FieldName.WHERE;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pins what apps receive from the Firestore plugin: the JSON of each field type and operation, and the error
 * messages. The JSON is written with the same {@link ObjectMapper} the server uses for action results.
 *
 * <p>The expected values are in {@code src/test/resources/firestore-sdk-snapshot.json}. Each run writes the actual
 * values to {@code target/firestore-sdk-snapshot.actual.json}. Values that change on every run, such as write times
 * and generated document IDs, are replaced by their JSON type. Error messages keep only the part the Firestore client
 * produces: the exception classes and the gRPC status code, not the emulator's detail text.
 *
 * <p>The connection goes to the emulator without credentials or TLS. It does not cover sign-in, retries or the client
 * that the plugin creates.
 *
 * <p>To accept an intended change, copy {@code target/firestore-sdk-snapshot.actual.json} over
 * {@code src/test/resources/firestore-sdk-snapshot.json} and run {@code mvn spotless:apply} on this module.
 *
 * <p>Two cases pin known bugs (APP-16569): {@code bytes} is written as {@code {}}, and paging with {@code next} on a
 * timestamp field returns an empty second page. A fix for either changes the snapshot.
 */
@Testcontainers
class FirestoreSdkBehaviourTest {

    private static final String SNAPSHOT_RESOURCE = "/firestore-sdk-snapshot.json";
    private static final Path ACTUAL_OUTPUT = Path.of("target", "firestore-sdk-snapshot.actual.json");
    private static final int TIMEOUT_SECONDS = 60;
    private static final Pattern GRPC_STATUS_PREFIX = Pattern.compile("^(.*?StatusRuntimeException: [A-Z_]+)");

    @Container
    static final FirestoreEmulatorContainer emulator = new FirestoreEmulatorContainer(
            DockerImageName.parse("gcr.io/google.com/cloudsdktool/google-cloud-cli:582.0.0-emulators"));

    private static final FirestorePlugin.FirestorePluginExecutor pluginExecutor =
            new FirestorePlugin.FirestorePluginExecutor();
    private static final ObjectMapper serverObjectMapper = SerializationUtils.getDefaultObjectMapper(null);
    private static final ObjectNode actual = JsonNodeFactory.instance.objectNode();

    private static Firestore connection;

    @BeforeAll
    static void recordEveryCase() throws Exception {
        connection = FirestoreOptions.newBuilder()
                .setHost(emulator.getEmulatorEndpoint())
                .setCredentials(NoCredentials.getInstance())
                .setRetrySettings(ServiceOptions.getNoRetrySettings())
                .setProjectId("test-project")
                .build()
                .getService();
        seed();

        actual.set("getDocumentWithEveryFieldType", body(run("GET_DOCUMENT", "sdk-snapshot/all-types", null)));
        actual.set("getMissingDocument", body(run("GET_DOCUMENT", "sdk-snapshot/missing", null)));
        actual.set("getCollectionWithWhereOrderByAndLimit", body(getCollectionWithWhereOrderByAndLimit()));
        actual.set("paginateByTimestamp", paginateByTimestamp());

        actual.set("getDocumentWithVectors", body(run("GET_DOCUMENT", "sdk-vectors/seeded", null)));
        actual.set("getCollectionWithVectors", body(run("GET_COLLECTION", "sdk-vectors", null)));
        actual.set("writeBackTheVectorsThatWereRead", writeBack("sdk-vectors/seeded", "sdk-copies/vectors"));

        actual.set("setDocument", shape(body(run("SET_DOCUMENT", "sdk-writes/set", "{\"n\": 1}"))));
        actual.set("createDocument", shape(body(run("CREATE_DOCUMENT", "sdk-writes/create", "{\"n\": 1}"))));
        actual.set("updateDocument", shape(body(run("UPDATE_DOCUMENT", "sdk-writes/set", "{\"n\": 2}"))));
        actual.set("deleteDocument", shape(body(run("DELETE_DOCUMENT", "sdk-writes/create", null))));
        actual.set("addToCollection", shape(body(run("ADD_TO_COLLECTION", "sdk-writes", "{\"n\": 3}"))));
        actual.set("updateWithServerTimestamp", updateWithServerTimestamp());

        actual.set("errorUpdateMissingDocument", error(run("UPDATE_DOCUMENT", "sdk-writes/missing", "{\"n\": 1}")));
        actual.set("errorCreateExistingDocument", error(run("CREATE_DOCUMENT", "sdk-writes/set", "{\"n\": 1}")));
        actual.set("errorDocumentPathWithOddSegments", error(run("GET_DOCUMENT", "sdk-snapshot", null)));
    }

    @AfterAll
    static void writeActualOutput() throws IOException {
        Files.createDirectories(ACTUAL_OUTPUT.getParent());
        Files.writeString(
                ACTUAL_OUTPUT,
                serverObjectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(sortedKeys(actual)),
                StandardCharsets.UTF_8);
    }

    static Stream<String> caseNames() throws IOException {
        return fieldNames(expectedSnapshot()).stream();
    }

    @Test
    void should_recordTheSameCases_when_comparedWithTheSnapshot() throws IOException {
        // Given
        List<String> expectedNames = fieldNames(expectedSnapshot());

        // When
        List<String> actualNames = fieldNames(actual);

        // Then
        assertThat(actualNames)
                .as("case names; to accept a change, see the class Javadoc")
                .containsExactlyInAnyOrderElementsOf(expectedNames);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("caseNames")
    void should_matchRecordedJson_when_caseRunsAgainstTheEmulator(String caseName) throws IOException {
        // Given
        JsonNode expected = expectedSnapshot().get(caseName);

        // When
        // Compare the JSON text the client receives, so a long and an int with the same value are equal.
        JsonNode result = serverObjectMapper.readTree(serverObjectMapper.writeValueAsString(actual.get(caseName)));

        // Then
        assertThat(result)
                .as("case %s, actual output in %s; to accept a change, see the class Javadoc", caseName, ACTUAL_OUTPUT)
                .isEqualTo(expected);
    }

    private static void seed() throws Exception {
        connection.document("sdk-snapshot/other").set(Map.of("name", "other")).get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

        Map<String, Object> allTypes = new HashMap<>();
        allTypes.put("string", "héllo wörld");
        allTypes.put("long", 9007199254740993L);
        allTypes.put("double", 1.5);
        allTypes.put("boolean", true);
        allTypes.put("nullValue", null);
        allTypes.put("map", Map.of("inner", "x", "n", 1));
        allTypes.put("array", List.of("a", 1, true));
        allTypes.put("timestamp", Timestamp.ofTimeSecondsAndNanos(1709214330L, 123456000));
        allTypes.put("date", new Date(1709214330123L));
        allTypes.put("geoPoint", new GeoPoint(12.5, -45.25));
        // Known bug APP-16569: the plugin writes this field as {}.
        allTypes.put("bytes", Blob.fromBytes("abc def".getBytes(StandardCharsets.UTF_8)));
        allTypes.put("reference", connection.document("sdk-snapshot/other"));
        allTypes.put("mapWithReference", Map.of("ref", connection.document("sdk-snapshot/other")));
        allTypes.put("arrayWithReference", List.of(connection.document("sdk-snapshot/other")));
        connection.document("sdk-snapshot/all-types").set(allTypes).get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

        // Firestore stores a vector as a map with reserved keys.
        Map<String, Object> vector = Map.of("__type__", "__vector__", "value", List.of(1.5, -2.25));
        connection
                .document("sdk-vectors/seeded")
                .set(Map.of(
                        "vector",
                        vector,
                        "inMap",
                        Map.of("vector", vector),
                        "inArray",
                        List.of(Map.of("vector", vector))))
                .get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        for (int i = 1; i <= 4; i++) {
            connection
                    .document("sdk-pages/p" + i)
                    .set(Map.of("n", i, "ts", Timestamp.ofTimeSecondsAndNanos(1709214330L + i, 0)))
                    .get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        }
    }

    private static ActionExecutionResult run(String command, String path, String body) {
        Map<String, Object> formData = new HashMap<>();
        setDataValueSafelyInFormData(formData, COMMAND, command);
        setDataValueSafelyInFormData(formData, PATH, path);
        if (body != null) {
            setDataValueSafelyInFormData(formData, BODY, body);
        }
        return execute(formData, new ExecuteActionDTO());
    }

    private static ActionExecutionResult execute(Map<String, Object> formData, ExecuteActionDTO executeActionDTO) {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);
        return pluginExecutor
                .executeParameterized(connection, executeActionDTO, new DatasourceConfiguration(), actionConfiguration)
                .block(Duration.ofSeconds(TIMEOUT_SECONDS));
    }

    private static ActionExecutionResult getCollectionWithWhereOrderByAndLimit() {
        Map<String, Object> formData = new HashMap<>();
        setDataValueSafelyInFormData(formData, COMMAND, "GET_COLLECTION");
        setDataValueSafelyInFormData(formData, PATH, "sdk-pages");
        setDataValueSafelyInFormData(formData, ORDER_BY, "[\"-n\"]");
        setDataValueSafelyInFormData(formData, LIMIT_DOCUMENTS, "2");
        setDataValueSafelyInFormData(
                formData, WHERE, Map.of(CHILDREN, List.of(Map.of("key", "n", "condition", "GT", "value", "1"))));
        return execute(formData, new ExecuteActionDTO());
    }

    /**
     * Apps page through a collection by sending the last row of a page back as {@code next}. That row is the JSON the
     * app received. Known bug APP-16569: the timestamp in that row is the JSON {@code {seconds, nanos}}, which the
     * plugin passes to {@code startAfter} as a map, so the second page is empty. This case pins the first page's order
     * and the second page's result, not working paging.
     */
    private static JsonNode paginateByTimestamp() throws IOException {
        Map<String, Object> formData = new HashMap<>();
        setDataValueSafelyInFormData(formData, COMMAND, "GET_COLLECTION");
        setDataValueSafelyInFormData(formData, PATH, "sdk-pages");
        setDataValueSafelyInFormData(formData, ORDER_BY, "[\"ts\"]");
        setDataValueSafelyInFormData(formData, LIMIT_DOCUMENTS, "2");

        ActionExecutionResult firstPage = execute(formData, new ExecuteActionDTO());
        JsonNode firstPageJson = body(firstPage);

        setDataValueSafelyInFormData(
                formData, NEXT, serverObjectMapper.writeValueAsString(firstPageJson.get(firstPageJson.size() - 1)));
        ExecuteActionDTO nextPage = new ExecuteActionDTO();
        nextPage.setPaginationField(PaginationField.NEXT);
        ActionExecutionResult secondPage = execute(formData, nextPage);

        ObjectNode pages = JsonNodeFactory.instance.objectNode();
        pages.set("firstPageIds", documentIds(firstPageJson));
        pages.set(
                "secondPage",
                Boolean.TRUE.equals(secondPage.getIsExecutionSuccess())
                        ? documentIds(body(secondPage))
                        : error(secondPage));
        return pages;
    }

    /** Apps can save a document that they read. Returns the copy, without the reference to itself. */
    private static JsonNode writeBack(String sourcePath, String targetPath) throws IOException {
        ObjectNode read = (ObjectNode) body(run("GET_DOCUMENT", sourcePath, null));
        read.remove("_ref");
        run("SET_DOCUMENT", targetPath, serverObjectMapper.writeValueAsString(read));

        ObjectNode copy = (ObjectNode) body(run("GET_DOCUMENT", targetPath, null));
        copy.remove("_ref");
        return copy;
    }

    private static JsonNode updateWithServerTimestamp() {
        Map<String, Object> formData = new HashMap<>();
        setDataValueSafelyInFormData(formData, COMMAND, "UPDATE_DOCUMENT");
        setDataValueSafelyInFormData(formData, PATH, "sdk-writes/set");
        setDataValueSafelyInFormData(formData, BODY, "{\"n\": 4}");
        setDataValueSafelyInFormData(formData, TIMESTAMP_VALUE_PATH, "[\"updatedAt\"]");

        ObjectNode node = JsonNodeFactory.instance.objectNode();
        node.set("update", shape(body(execute(formData, new ExecuteActionDTO()))));
        // Only the server-set time changes on every run.
        ObjectNode readBack = (ObjectNode) body(run("GET_DOCUMENT", "sdk-writes/set", null));
        readBack.set("updatedAt", shape(readBack.path("updatedAt")));
        node.set("readBack", readBack);
        return node;
    }

    private static JsonNode body(ActionExecutionResult result) {
        if (!Boolean.TRUE.equals(result.getIsExecutionSuccess())) {
            return error(result);
        }
        return serverObjectMapper.valueToTree(result.getBody());
    }

    private static JsonNode error(ActionExecutionResult result) {
        ObjectNode node = JsonNodeFactory.instance.objectNode();
        node.put("isExecutionSuccess", result.getIsExecutionSuccess());
        if (result.getPluginErrorDetails() != null) {
            node.put("title", result.getPluginErrorDetails().getTitle());
            node.put("appsmithErrorMessage", result.getPluginErrorDetails().getAppsmithErrorMessage());
            node.put(
                    "downstreamErrorMessage",
                    clientOwnedPart(result.getPluginErrorDetails().getDownstreamErrorMessage()));
        }
        return node;
    }

    /**
     * Keeps a gRPC error message up to its status code, such as
     * {@code com.google.api.gax.rpc.NotFoundException: io.grpc.StatusRuntimeException: NOT_FOUND}. The text after it
     * comes from the emulator, not from the Firestore client. Other messages are kept whole.
     */
    private static String clientOwnedPart(String message) {
        if (message == null) {
            return null;
        }
        Matcher matcher = GRPC_STATUS_PREFIX.matcher(message);
        return matcher.find() ? matcher.group(1) : message;
    }

    private static List<String> fieldNames(JsonNode node) {
        List<String> names = new ArrayList<>();
        node.fieldNames().forEachRemaining(names::add);
        return names;
    }

    private static ArrayNode documentIds(JsonNode documents) {
        ArrayNode ids = JsonNodeFactory.instance.arrayNode();
        documents.forEach(document -> ids.add(document.path("_ref").path("id").asText()));
        return ids;
    }

    /** Replaces every leaf with its JSON type, keeping the keys and nesting. */
    private static JsonNode shape(JsonNode node) {
        if (node.isObject()) {
            ObjectNode shaped = JsonNodeFactory.instance.objectNode();
            node.fields().forEachRemaining(field -> shaped.set(field.getKey(), shape(field.getValue())));
            return shaped;
        }
        if (node.isArray()) {
            ArrayNode shaped = JsonNodeFactory.instance.arrayNode();
            node.forEach(item -> shaped.add(shape(item)));
            return shaped;
        }
        return TextNode.valueOf("<" + node.getNodeType().name().toLowerCase() + ">");
    }

    private static JsonNode sortedKeys(JsonNode node) {
        if (node.isObject()) {
            ObjectNode sorted = JsonNodeFactory.instance.objectNode();
            List<String> names = new ArrayList<>();
            node.fieldNames().forEachRemaining(names::add);
            names.stream().sorted().forEach(name -> sorted.set(name, sortedKeys(node.get(name))));
            return sorted;
        }
        if (node.isArray()) {
            ArrayNode sorted = JsonNodeFactory.instance.arrayNode();
            for (Iterator<JsonNode> it = node.elements(); it.hasNext(); ) {
                sorted.add(sortedKeys(it.next()));
            }
            return sorted;
        }
        return node;
    }

    private static JsonNode expectedSnapshot() throws IOException {
        try (InputStream in = FirestoreSdkBehaviourTest.class.getResourceAsStream(SNAPSHOT_RESOURCE)) {
            assertThat(in).as("missing test resource %s", SNAPSHOT_RESOURCE).isNotNull();
            return serverObjectMapper.readTree(in);
        }
    }
}
