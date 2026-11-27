package com.external.plugins;

import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.helpers.PluginUtils;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.RequestParamDTO;
import com.external.plugins.exceptions.FirestoreErrorMessages;
import com.external.plugins.exceptions.FirestorePluginError;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.cloud.NoCredentials;
import com.google.cloud.ServiceOptions;
import com.google.cloud.firestore.Blob;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreException;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.cloud.firestore.GeoPoint;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.google.firebase.internal.EmulatorCredentials;
import io.grpc.Status;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mockito;
import org.testcontainers.containers.FirestoreEmulatorContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import reactor.core.Disposable;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.sql.Timestamp;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_PATH;
import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.constants.FieldName.BODY;
import static com.external.constants.FieldName.CHILDREN;
import static com.external.constants.FieldName.COMMAND;
import static com.external.constants.FieldName.DELETE_KEY_PATH;
import static com.external.constants.FieldName.END_BEFORE;
import static com.external.constants.FieldName.LIMIT_DOCUMENTS;
import static com.external.constants.FieldName.NEXT;
import static com.external.constants.FieldName.ORDER_BY;
import static com.external.constants.FieldName.PATH;
import static com.external.constants.FieldName.PREV;
import static com.external.constants.FieldName.START_AFTER;
import static com.external.constants.FieldName.TIMESTAMP_VALUE_PATH;
import static com.external.constants.FieldName.WHERE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Slf4j
@Testcontainers
public class FirestorePluginTest {

    FirestorePlugin.FirestorePluginExecutor pluginExecutor = new FirestorePlugin.FirestorePluginExecutor();

    @Container
    public static final FirestoreEmulatorContainer emulator = new FirestoreEmulatorContainer(
            DockerImageName.parse("gcr.io/google.com/cloudsdktool/google-cloud-cli:582.0.0-emulators"));

    static Firestore firestoreConnection;

    static DatasourceConfiguration dsConfig = new DatasourceConfiguration();

    private static Firestore emulatorConnection() {
        return FirestoreOptions.newBuilder()
                .setHost(emulator.getEmulatorEndpoint())
                .setCredentials(NoCredentials.getInstance())
                .setRetrySettings(ServiceOptions.getNoRetrySettings())
                .setProjectId("test-project")
                .build()
                .getService();
    }

    @BeforeAll
    public static void setUp() throws ExecutionException, InterruptedException, ParseException {
        firestoreConnection = emulatorConnection();

        firestoreConnection
                .document("initial/one")
                .set(Map.of("value", 1, "name", "one", "isPlural", false, "category", "test"))
                .get();
        final Map<String, Object> twoData = new HashMap<>(Map.of(
                "value",
                2,
                "name",
                "two",
                "isPlural",
                true,
                "geo",
                new GeoPoint(-90, 90),
                "dt",
                FieldValue.serverTimestamp(),
                "ref",
                firestoreConnection.document("initial/one"),
                "bytes",
                Blob.fromBytes("abc def".getBytes(StandardCharsets.UTF_8)),
                "category",
                "test"));
        twoData.put("null-ref", null);
        firestoreConnection.document("initial/two").set(twoData).get();
        firestoreConnection
                .document("initial/inner-ref")
                .set(Map.of(
                        "name", "third",
                        "data",
                                Map.of(
                                        "ref", firestoreConnection.document("initial/one"),
                                        "isAwesome", false,
                                        "anotherRef", firestoreConnection.document("initial/two")),
                        "ref-list",
                                List.of(
                                        firestoreConnection.document("initial/one"),
                                        firestoreConnection.document("initial/two"))))
                .get();

        final Map<String, Object> numData = new HashMap<>(Map.of(
                "score", Integer.valueOf("99"),
                "isPlural", Boolean.TRUE,
                "dob", new SimpleDateFormat("yyyy-MM-dd").parse("2000-03-24"),
                "start", Timestamp.valueOf("2018-09-01 09:01:15")));
        firestoreConnection.document("numeric/two").set(numData).get();

        firestoreConnection
                .document("info/family")
                .set(Map.of(
                        "kids", Arrays.asList("Ally", "Dolly", "Shelly", "Kelly"),
                        "cars", Arrays.asList("Odyssey", "Dodge"),
                        "wife", "Billy",
                        "phone_numbers",
                                Arrays.asList(
                                        Integer.valueOf("555"),
                                        Integer.valueOf("99"),
                                        Integer.valueOf("333"),
                                        Integer.valueOf("888"))))
                .get();

        firestoreConnection
                .document("changing/to-update")
                .set(Map.of("value", 1))
                .get();
        firestoreConnection
                .document("changing/to-delete")
                .set(Map.of("value", 1))
                .get();

        final CollectionReference paginationCol = firestoreConnection.collection("pagination");
        paginationCol
                .add(Map.of("n", 1, "name", "Michele Cole", "firm", "Appsmith", "age", 42))
                .get();
        paginationCol
                .add(Map.of("n", 2, "name", "Meghan Steele", "firm", "Google", "age", 26))
                .get();
        paginationCol
                .add(Map.of("n", 3, "name", "Della Moore", "firm", "Facebook", "age", 19))
                .get();
        paginationCol
                .add(Map.of("n", 4, "name", "Eunice Hines", "firm", "Microsoft", "age", 28))
                .get();
        paginationCol
                .add(Map.of("n", 5, "name", "Harriet Myers", "firm", "Netflix", "age", 33))
                .get();
        paginationCol
                .add(Map.of("n", 6, "name", "Lowell Reese", "firm", "Apple", "age", 36))
                .get();
        paginationCol
                .add(Map.of("n", 7, "name", "Gerard Neal", "firm", "Oracle", "age", 41))
                .get();
        paginationCol
                .add(Map.of("n", 8, "name", "Allen Arnold", "firm", "IBM", "age", 29))
                .get();
        paginationCol
                .add(Map.of("n", 9, "name", "Josefina Perkins", "firm", "Google", "age", 22))
                .get();
        paginationCol
                .add(Map.of("n", 10, "name", "Alvin Zimmerman", "firm", "Facebook", "age", 24))
                .get();
        paginationCol
                .add(Map.of("n", 11, "name", "Israel Broc", "firm", "Microsoft", "age", 27))
                .get();
        paginationCol
                .add(Map.of("n", 12, "name", "Larry Frazie", "firm", "Netflix", "age", 30))
                .get();
        paginationCol
                .add(Map.of("n", 13, "name", "Rufus Green", "firm", "Apple", "age", 35))
                .get();
        paginationCol
                .add(Map.of("n", 14, "name", "Marco Murray", "firm", "Oracle", "age", 38))
                .get();
        paginationCol
                .add(Map.of("n", 15, "name", "Jeremy Mille", "firm", "IBM", "age", 31))
                .get();

        dsConfig.setUrl(emulator.getEmulatorEndpoint());
        DBAuth auth = new DBAuth();
        auth.setUsername("test-project");
        auth.setPassword("");
        dsConfig.setAuthentication(auth);
    }

    @Test
    public void testGetSingleDocument() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_DOCUMENT");
        setDataValueSafelyInFormData(configMap, PATH, "initial/one");
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    final Map<String, Object> first = (Map) result.getBody();
                    assertEquals("one", first.remove("name"));
                    assertFalse((Boolean) first.remove("isPlural"));
                    assertEquals(1L, first.remove("value"));
                    assertEquals(Map.of("id", "one", "path", "initial/one"), first.remove("_ref"));
                    assertEquals("test", first.remove("category"));
                    assertEquals(Collections.emptyMap(), first);

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(COMMAND, "GET_DOCUMENT", null, null, null)); // Method
                    expectedRequestParams.add(new RequestParamDTO(
                            ACTION_CONFIGURATION_PATH,
                            PluginUtils.getDataValueSafelyFromFormData(
                                    actionConfiguration.getFormData(), PATH, STRING_TYPE),
                            null,
                            null,
                            null)); // Path
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testGetSingleDocument2() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_DOCUMENT");
        setDataValueSafelyInFormData(configMap, PATH, "initial/two");
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    final Map<String, Object> doc = (Map) result.getBody();
                    assertEquals("two", doc.remove("name"));
                    assertTrue((Boolean) doc.remove("isPlural"));
                    assertEquals(2L, doc.remove("value"));
                    assertEquals(Map.of("path", "initial/one", "id", "one"), doc.remove("ref"));
                    assertEquals(new GeoPoint(-90, 90), doc.remove("geo"));
                    assertNotNull(doc.remove("dt"));
                    assertEquals(
                            "abc def",
                            ((Blob) doc.remove("bytes")).toByteString().toStringUtf8());
                    assertNull(doc.remove("null-ref"));
                    assertEquals(Map.of("id", "two", "path", "initial/two"), doc.remove("_ref"));
                    assertEquals("test", doc.remove("category"));
                    assertEquals(Collections.emptyMap(), doc);
                })
                .verifyComplete();
    }

    @Test
    public void testGetSingleDocument3() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_DOCUMENT");
        setDataValueSafelyInFormData(configMap, PATH, "initial/inner-ref");
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    final Map<String, Object> doc = (Map) result.getBody();
                    assertEquals("third", doc.remove("name"));
                    assertEquals(
                            Map.of(
                                    "ref", Map.of("path", "initial/one", "id", "one"),
                                    "isAwesome", false,
                                    "anotherRef", Map.of("path", "initial/two", "id", "two")),
                            doc.remove("data"));
                    assertEquals(
                            List.of(
                                    Map.of("path", "initial/one", "id", "one"),
                                    Map.of("path", "initial/two", "id", "two")),
                            doc.remove("ref-list"));
                    assertEquals(Map.of("id", "inner-ref", "path", "initial/inner-ref"), doc.remove("_ref"));
                    assertEquals(Collections.emptyMap(), doc);
                })
                .verifyComplete();
    }

    @Test
    public void testGetDocumentsInCollection() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_COLLECTION");
        setDataValueSafelyInFormData(configMap, PATH, "initial");
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    List<Map<String, Object>> results = (List) result.getBody();
                    assertEquals(3, results.size());

                    final Map<String, Object> first = results.stream()
                            .filter(d -> "one".equals(d.get("name")))
                            .findFirst()
                            .orElse(null);
                    assertNotNull(first);
                    assertEquals("one", first.remove("name"));
                    assertFalse((Boolean) first.remove("isPlural"));
                    assertEquals(1L, first.remove("value"));
                    assertEquals(Map.of("id", "one", "path", "initial/one"), first.remove("_ref"));
                    assertEquals("test", first.remove("category"));
                    assertEquals(Collections.emptyMap(), first);

                    final Map<String, Object> second = results.stream()
                            .filter(d -> "two".equals(d.get("name")))
                            .findFirst()
                            .orElse(null);
                    assertNotNull(second);
                    assertEquals("two", second.remove("name"));
                    assertTrue((Boolean) second.remove("isPlural"));
                    assertEquals(2L, second.remove("value"));
                    assertEquals(Map.of("path", "initial/one", "id", "one"), second.remove("ref"));
                    assertEquals(new GeoPoint(-90, 90), second.remove("geo"));
                    assertNotNull(second.remove("dt"));
                    assertEquals(
                            "abc def",
                            ((Blob) second.remove("bytes")).toByteString().toStringUtf8());
                    assertNull(second.remove("null-ref"));
                    assertEquals(Map.of("id", "two", "path", "initial/two"), second.remove("_ref"));
                    assertEquals("test", second.remove("category"));
                    assertEquals(Collections.emptyMap(), second);

                    final Map<String, Object> third = results.stream()
                            .filter(d -> "third".equals(d.get("name")))
                            .findFirst()
                            .orElse(null);
                    assertNotNull(third);
                    assertEquals("third", third.remove("name"));
                    assertEquals(
                            Map.of(
                                    "ref", Map.of("path", "initial/one", "id", "one"),
                                    "isAwesome", false,
                                    "anotherRef", Map.of("path", "initial/two", "id", "two")),
                            third.remove("data"));
                    assertEquals(
                            List.of(
                                    Map.of("path", "initial/one", "id", "one"),
                                    Map.of("path", "initial/two", "id", "two")),
                            third.remove("ref-list"));
                    assertEquals(Map.of("id", "inner-ref", "path", "initial/inner-ref"), third.remove("_ref"));
                    assertEquals(Collections.emptyMap(), third);
                })
                .verifyComplete();
    }

    @Test
    public void testSetNewDocument() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "SET_DOCUMENT");
        setDataValueSafelyInFormData(configMap, PATH, "test/new_with_set");
        setDataValueSafelyInFormData(
                configMap, BODY, "{\n" + "    \"firstName\": \"test\",\n" + "    \"lastName\":\"lastTest\"\n" + "}");
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(COMMAND, "SET_DOCUMENT", null, null, null)); // Method
                    expectedRequestParams.add(new RequestParamDTO(
                            ACTION_CONFIGURATION_PATH,
                            PluginUtils.getDataValueSafelyFromFormData(
                                    actionConfiguration.getFormData(), PATH, STRING_TYPE),
                            null,
                            null,
                            null)); // Path
                    expectedRequestParams.add(new RequestParamDTO(
                            ACTION_CONFIGURATION_BODY,
                            PluginUtils.getDataValueSafelyFromFormData(
                                    actionConfiguration.getFormData(), BODY, STRING_TYPE),
                            null,
                            null,
                            null)); // Body
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testCreateDocument() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "CREATE_DOCUMENT");
        setDataValueSafelyInFormData(configMap, PATH, "test/new_with_create");
        setDataValueSafelyInFormData(
                configMap, BODY, "{\n" + "    \"firstName\": \"test\",\n" + "    \"lastName\":\"lastTest\"\n" + "}");
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(COMMAND, "CREATE_DOCUMENT", null, null, null));
                    expectedRequestParams.add(new RequestParamDTO(
                            ACTION_CONFIGURATION_PATH,
                            PluginUtils.getDataValueSafelyFromFormData(
                                    actionConfiguration.getFormData(), PATH, STRING_TYPE),
                            null,
                            null,
                            null)); // Path
                    expectedRequestParams.add(new RequestParamDTO(
                            ACTION_CONFIGURATION_BODY,
                            PluginUtils.getDataValueSafelyFromFormData(
                                    actionConfiguration.getFormData(), BODY, STRING_TYPE),
                            null,
                            null,
                            null)); // Body
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testUpdateDocument() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "UPDATE_DOCUMENT");
        setDataValueSafelyInFormData(configMap, PATH, "changing/to-update");
        setDataValueSafelyInFormData(configMap, BODY, "{\n" + "    \"value\": 2\n" + "}");
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    try {
                        final DocumentSnapshot documentSnapshot = firestoreConnection
                                .document("changing/to-update")
                                .get()
                                .get();
                        assertTrue(documentSnapshot.exists());
                        assertEquals(2L, documentSnapshot.getLong("value").longValue());
                    } catch (NullPointerException | InterruptedException | ExecutionException e) {
                        e.printStackTrace();
                    }
                })
                .verifyComplete();
    }

    @Test
    public void testDeleteDocument() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "DELETE_DOCUMENT");
        setDataValueSafelyInFormData(configMap, PATH, "changing/to-delete");
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    try {
                        final DocumentSnapshot documentSnapshot = firestoreConnection
                                .document("changing/to-delete")
                                .get()
                                .get();
                        assertFalse(documentSnapshot.exists());
                    } catch (InterruptedException | ExecutionException e) {
                        e.printStackTrace();
                    }

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(COMMAND, "DELETE_DOCUMENT", null, null, null));
                    expectedRequestParams.add(new RequestParamDTO(
                            ACTION_CONFIGURATION_PATH,
                            PluginUtils.getDataValueSafelyFromFormData(
                                    actionConfiguration.getFormData(), PATH, STRING_TYPE),
                            null,
                            null,
                            null)); // Path
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testAddToCollection() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "ADD_TO_COLLECTION");
        setDataValueSafelyInFormData(configMap, PATH, "changing");
        setDataValueSafelyInFormData(
                configMap,
                BODY,
                "{\n" + "  \"question\": \"What is the answer to life, universe and everything else?\",\n"
                        + "  \"answer\": 42\n"
                        + "}");

        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(firestoreConnection.document("changing/" + ((Map) result.getBody()).get("id")));

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(COMMAND, "ADD_TO_COLLECTION", null, null, null));
                    expectedRequestParams.add(new RequestParamDTO(
                            ACTION_CONFIGURATION_PATH,
                            PluginUtils.getDataValueSafelyFromFormData(
                                    actionConfiguration.getFormData(), PATH, STRING_TYPE),
                            null,
                            null,
                            null)); // Path
                    expectedRequestParams.add(new RequestParamDTO(
                            ACTION_CONFIGURATION_BODY,
                            PluginUtils.getDataValueSafelyFromFormData(
                                    actionConfiguration.getFormData(), BODY, STRING_TYPE),
                            null,
                            null,
                            null)); // Body
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    private ActionConfiguration constructActionConfiguration(
            Map<String, Object> first, Map<String, Object> last, String limit) {
        final ObjectMapper objectMapper = new ObjectMapper();
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_COLLECTION");
        setDataValueSafelyInFormData(configMap, ORDER_BY, "[\"n\"]");
        setDataValueSafelyInFormData(configMap, LIMIT_DOCUMENTS, limit);
        setDataValueSafelyInFormData(configMap, PATH, "pagination");

        if (first != null && last != null) {
            try {
                setDataValueSafelyInFormData(configMap, NEXT, objectMapper.writeValueAsString(last));
                setDataValueSafelyInFormData(configMap, PREV, objectMapper.writeValueAsString(first));
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
        }

        actionConfiguration.setFormData(configMap);
        return actionConfiguration;
    }

    private Mono<ActionExecutionResult> getNextOrPrevPage(
            ActionExecutionResult currentPage, PaginationField paginationField, String limit) {
        List<Map<String, Object>> results = (List) currentPage.getBody();
        final Map<String, Object> first = results.get(0);
        final Map<String, Object> last = results.get(results.size() - 1);

        final ExecuteActionDTO execDetails = new ExecuteActionDTO();
        execDetails.setPaginationField(paginationField);

        final ActionConfiguration actionConfiguration1 = constructActionConfiguration(first, last, limit);
        return pluginExecutor.executeParameterized(firestoreConnection, execDetails, dsConfig, actionConfiguration1);
    }

    @Test
    public void testPagination() {
        final ActionConfiguration actionConfiguration = constructActionConfiguration(null, null, "5");
        // Fetch data for page 1
        Mono<ActionExecutionResult> page1Mono = pluginExecutor
                .executeParameterized(firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration)
                .cache();

        // Fetch data for page 2 by clicking on the next button
        Mono<ActionExecutionResult> page2Mono = page1Mono
                .flatMap(page1 -> getNextOrPrevPage(page1, PaginationField.NEXT, "5"))
                .cache();

        // Fetch data for page 3 by clicking on the next button
        Mono<ActionExecutionResult> page3Mono = page2Mono
                .flatMap(page2 -> getNextOrPrevPage(page2, PaginationField.NEXT, "5"))
                .cache();

        // Fetch data for page 2 by clicking on the previous button
        Mono<ActionExecutionResult> prevPage2Mono = page3Mono
                .flatMap(page3 -> getNextOrPrevPage(page3, PaginationField.PREV, "5"))
                .cache();

        var pagesMono = Mono.zip(page1Mono, page2Mono, page3Mono, prevPage2Mono);

        StepVerifier.create(pagesMono)
                .assertNext(resultPages -> {
                    final ActionExecutionResult firstPageResult = resultPages.getT1();
                    final ActionExecutionResult secondPageResult = resultPages.getT2();
                    final ActionExecutionResult thirdPageResult = resultPages.getT3();
                    final ActionExecutionResult secondPageResultAgain = resultPages.getT4();

                    assertTrue(firstPageResult.getIsExecutionSuccess());

                    List<Map<String, Object>> firstResults = (List) firstPageResult.getBody();
                    assertEquals(5, firstResults.size());
                    assertEquals(
                            "[1, 2, 3, 4, 5]",
                            firstResults.stream()
                                    .map(m -> m.get("n").toString())
                                    .collect(Collectors.toList())
                                    .toString());

                    List<Map<String, Object>> secondResults = (List) secondPageResult.getBody();
                    assertEquals(5, secondResults.size());
                    assertEquals(
                            "[6, 7, 8, 9, 10]",
                            secondResults.stream()
                                    .map(m -> m.get("n").toString())
                                    .collect(Collectors.toList())
                                    .toString());

                    List<Map<String, Object>> firstResultsAgain = (List) thirdPageResult.getBody();
                    assertEquals(5, firstResultsAgain.size());
                    assertEquals(
                            "[11, 12, 13, 14, 15]",
                            firstResultsAgain.stream()
                                    .map(m -> m.get("n").toString())
                                    .collect(Collectors.toList())
                                    .toString());

                    List<Map<String, Object>> secondResultsAgain = (List) secondPageResultAgain.getBody();
                    assertEquals(5, secondResultsAgain.size());
                    assertEquals(
                            "[6, 7, 8, 9, 10]",
                            secondResultsAgain.stream()
                                    .map(m -> m.get("n").toString())
                                    .collect(Collectors.toList())
                                    .toString());
                })
                .verifyComplete();
    }

    @Test
    public void testDatasourceCreateErrorOnBadServiceAccountCredentials() {
        DBAuth dbAuth = new DBAuth();
        dbAuth.setUsername("username");
        dbAuth.setPassword("password");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(dbAuth);
        datasourceConfiguration.setUrl("https://url");

        StepVerifier.create(pluginExecutor.datasourceCreate(datasourceConfiguration))
                .expectErrorSatisfies(error -> {
                    // Check that error is caught and returned as plugin error.
                    assertTrue(error instanceof AppsmithPluginException);

                    // Check error message.
                    assertEquals(
                            FirestoreErrorMessages.DS_VALIDATION_FAILED_FOR_SERVICE_ACC_CREDENTIALS_ERROR_MSG,
                            error.getMessage());

                    // Check that the error does not get logged externally.
                    assertNotEquals(
                            AppsmithErrorAction.LOG_EXTERNALLY,
                            ((AppsmithPluginException) error).getError().getErrorAction());
                })
                .verify();
    }

    private static String serviceAccountJson(String projectId, String clientEmail) throws NoSuchAlgorithmException {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(2048);
        KeyPair keyPair = keyPairGenerator.generateKeyPair();
        String privateKeyPem = "-----BEGIN PRIVATE KEY-----\n"
                + Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.UTF_8))
                        .encodeToString(keyPair.getPrivate().getEncoded())
                + "\n-----END PRIVATE KEY-----\n";

        Map<String, String> json = new HashMap<>();
        json.put("type", "service_account");
        json.put("project_id", projectId);
        json.put("private_key_id", "test-key-id");
        json.put("private_key", privateKeyPem);
        json.put("client_email", clientEmail);
        json.put("client_id", "1234567890");
        json.put("token_uri", "https://oauth2.googleapis.com/token");
        try {
            return new ObjectMapper().writeValueAsString(json);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    private static DatasourceConfiguration serviceAccountDatasourceConfig(
            String projectId, String clientJson, String databaseId) {
        DBAuth auth = new DBAuth();
        auth.setUsername(projectId);
        auth.setPassword(clientJson);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(auth);
        datasourceConfiguration.setUrl("https://" + projectId + ".firebaseio.com");
        if (databaseId != null) {
            datasourceConfiguration.setProperties(List.of(new Property("Database ID", databaseId)));
        }
        return datasourceConfiguration;
    }

    private static String clientEmailOf(Firestore firestore) {
        return ((ServiceAccountCredentials) firestore.getOptions().getCredentials()).getClientEmail();
    }

    @Test
    void should_useNamedDatabase_when_databaseIdIsSet() throws NoSuchAlgorithmException {
        // Given
        String projectId = "named-db-project";
        DatasourceConfiguration datasourceConfiguration = serviceAccountDatasourceConfig(
                projectId, serviceAccountJson(projectId, "sa@named-db-project.iam.gserviceaccount.com"), "my-db");

        // When
        Mono<Firestore> result = pluginExecutor.datasourceCreate(datasourceConfiguration);

        // Then
        StepVerifier.create(result)
                .assertNext(firestore ->
                        assertThat(firestore.getOptions().getDatabaseId()).isEqualTo("my-db"))
                .verifyComplete();
    }

    @Test
    void should_trimWhitespace_when_databaseIdIsPadded() throws NoSuchAlgorithmException {
        // Given
        String projectId = "padded-db-project";
        DatasourceConfiguration datasourceConfiguration = serviceAccountDatasourceConfig(
                projectId, serviceAccountJson(projectId, "sa@padded-db-project.iam.gserviceaccount.com"), "  my-db  ");

        // When
        Mono<Firestore> result = pluginExecutor.datasourceCreate(datasourceConfiguration);

        // Then
        StepVerifier.create(result)
                .assertNext(firestore ->
                        assertThat(firestore.getOptions().getDatabaseId()).isEqualTo("my-db"))
                .verifyComplete();
    }

    @Test
    void should_useDefaultDatabase_when_databaseIdIsAbsentOrEmpty() throws NoSuchAlgorithmException {
        // Given
        String projectId = "default-db-project";
        String clientJson = serviceAccountJson(projectId, "sa@default-db-project.iam.gserviceaccount.com");

        // When
        Mono<Firestore> withoutProperty =
                pluginExecutor.datasourceCreate(serviceAccountDatasourceConfig(projectId, clientJson, null));
        Mono<Firestore> withEmptyProperty =
                pluginExecutor.datasourceCreate(serviceAccountDatasourceConfig(projectId, clientJson, ""));

        // Then
        StepVerifier.create(withoutProperty)
                .assertNext(firestore -> assertThat(firestore.getOptions().getDatabaseId())
                        .isEqualTo(FirestorePlugin.FirestorePluginExecutor.DEFAULT_DATABASE_ID))
                .verifyComplete();
        StepVerifier.create(withEmptyProperty)
                .assertNext(firestore -> assertThat(firestore.getOptions().getDatabaseId())
                        .isEqualTo(FirestorePlugin.FirestorePluginExecutor.DEFAULT_DATABASE_ID))
                .verifyComplete();
    }

    @Test
    void should_useOwnCredentials_when_sameProjectHasDifferentCredentials() throws NoSuchAlgorithmException {
        // Given
        String projectId = "shared-project";
        DatasourceConfiguration first = serviceAccountDatasourceConfig(
                projectId, serviceAccountJson(projectId, "first@shared-project.iam.gserviceaccount.com"), null);
        DatasourceConfiguration second = serviceAccountDatasourceConfig(
                projectId, serviceAccountJson(projectId, "second@shared-project.iam.gserviceaccount.com"), null);

        // When
        Firestore firstFirestore = pluginExecutor.datasourceCreate(first).block();
        Firestore secondFirestore = pluginExecutor.datasourceCreate(second).block();

        // Then
        assertThat(firstFirestore).isNotNull();
        assertThat(secondFirestore).isNotNull();
        assertThat(clientEmailOf(firstFirestore)).isEqualTo("first@shared-project.iam.gserviceaccount.com");
        assertThat(clientEmailOf(secondFirestore)).isEqualTo("second@shared-project.iam.gserviceaccount.com");
    }

    @Test
    void should_shareClient_when_sameConfigIsCreatedTwice() throws NoSuchAlgorithmException {
        // Given
        String projectId = "shared-client-project";
        DatasourceConfiguration datasourceConfiguration = serviceAccountDatasourceConfig(
                projectId, serviceAccountJson(projectId, "sa@shared-client-project.iam.gserviceaccount.com"), "my-db");
        Firestore first =
                pluginExecutor.datasourceCreate(datasourceConfiguration).block();

        // When
        // The server creates an executor for each call.
        Firestore second = new FirestorePlugin.FirestorePluginExecutor()
                .datasourceCreate(datasourceConfiguration)
                .block();

        // Then
        assertThat(first).isNotNull();
        assertThat(second).isSameAs(first);
    }

    @Test
    void should_notRegisterFirebaseApp_when_connectionIsCreated() throws NoSuchAlgorithmException {
        // Given
        String projectId = "unregistered-project";
        DatasourceConfiguration datasourceConfiguration = serviceAccountDatasourceConfig(
                projectId, serviceAccountJson(projectId, "sa@unregistered-project.iam.gserviceaccount.com"), null);
        List<FirebaseApp> appsBefore = FirebaseApp.getApps();

        // When
        pluginExecutor.datasourceCreate(datasourceConfiguration).block();

        // Then
        assertThat(FirebaseApp.getApps()).hasSameSizeAs(appsBefore);
    }

    @Test
    void should_requestOAuthScopes_when_connectionIsCreated() throws Exception {
        // Given
        String projectId = "scoped-project";
        DatasourceConfiguration datasourceConfiguration = serviceAccountDatasourceConfig(
                projectId, serviceAccountJson(projectId, "sa@scoped-project.iam.gserviceaccount.com"), null);

        // When
        Firestore connection =
                pluginExecutor.datasourceCreate(datasourceConfiguration).block();

        // Then
        ServiceAccountCredentials credentials = (ServiceAccountCredentials)
                connection.getOptions().getCredentialsProvider().getCredentials();
        assertThat(credentials.getScopes()).contains("https://www.googleapis.com/auth/datastore");
    }

    @Test
    void should_keepClientOpen_when_datasourceIsDestroyed() {
        // Given
        Firestore connection = Mockito.mock(Firestore.class);

        // When
        pluginExecutor.datasourceDestroy(connection);

        // Then
        Mockito.verifyNoInteractions(connection);
    }

    @Test
    void should_checkTheClientOnThePluginThread_when_queryRuns() throws NoSuchAlgorithmException {
        // Given
        String clientJson = serviceAccountJson("used-project", "sa@used-project.iam.gserviceaccount.com");
        AtomicReference<String> threadName = new AtomicReference<>();
        FirestoreClientCache clientCache = Mockito.mock(FirestoreClientCache.class);
        Mockito.when(clientCache.isOpen(
                        FirestoreClientCache.Key.of("used-project", clientJson, "my-db"), firestoreConnection))
                .thenAnswer(invocation -> {
                    threadName.set(Thread.currentThread().getName());
                    return true;
                });
        FirestorePlugin.FirestorePluginExecutor executor = new FirestorePlugin.FirestorePluginExecutor(clientCache);

        // When
        ActionExecutionResult result = executor.executeParameterized(
                        firestoreConnection,
                        new ExecuteActionDTO(),
                        serviceAccountDatasourceConfig("used-project", clientJson, "my-db"),
                        getDocumentAction())
                .block();

        // Then
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(threadName.get()).startsWith("boundedElastic");
    }

    @Test
    void should_returnStaleConnectionErrorAndKeepFormData_when_clientWasRemovedBeforeTheQuery() {
        // Given
        FirestorePlugin.FirestorePluginExecutor executor =
                new FirestorePlugin.FirestorePluginExecutor(Mockito.mock(FirestoreClientCache.class));
        Param param = new Param();
        param.setKey("Input1.text");
        param.setValue("value");
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(List.of(param));
        Map<String, Object> formData = new HashMap<>();
        setDataValueSafelyInFormData(formData, COMMAND, "SET_DOCUMENT");
        setDataValueSafelyInFormData(formData, PATH, "initial/one");
        setDataValueSafelyInFormData(formData, BODY, "{\"value\": {{Input1.text}}}");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);

        // When
        Mono<ActionExecutionResult> result = executor.executeParameterized(
                Mockito.mock(Firestore.class),
                executeActionDTO,
                serviceAccountDatasourceConfig("removed-project", "{}", null),
                actionConfiguration);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(StaleConnectionException.class)
                        .hasMessage(FirestoreErrorMessages.CONNECTION_CLOSED_ERROR_MSG))
                .verify(Duration.ofSeconds(10));
        assertThat(PluginUtils.getDataValueSafelyFromFormData(actionConfiguration.getFormData(), BODY, STRING_TYPE))
                .isEqualTo("{\"value\": {{Input1.text}}}");
    }

    @Test
    void should_returnStaleConnectionError_when_clientWasRemovedBeforeTheStructureIsRead() {
        // Given
        FirestorePlugin.FirestorePluginExecutor executor =
                new FirestorePlugin.FirestorePluginExecutor(Mockito.mock(FirestoreClientCache.class));

        // When
        Mono<DatasourceStructure> result = executor.getStructure(
                Mockito.mock(Firestore.class), serviceAccountDatasourceConfig("removed-project", "{}", null));

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(StaleConnectionException.class)
                        .hasMessage(FirestoreErrorMessages.CONNECTION_CLOSED_ERROR_MSG))
                .verify(Duration.ofSeconds(10));
    }

    @Test
    void should_readStructure_when_clientIsOpen() {
        // Given
        Firestore connection = Mockito.mock(Firestore.class);
        Mockito.when(connection.listCollections()).thenReturn(Collections.emptyList());
        FirestoreClientCache clientCache = Mockito.mock(FirestoreClientCache.class);
        Mockito.when(clientCache.isOpen(
                        FirestoreClientCache.Key.of(
                                "open-project", "{}", FirestorePlugin.FirestorePluginExecutor.DEFAULT_DATABASE_ID),
                        connection))
                .thenReturn(true);
        FirestorePlugin.FirestorePluginExecutor executor = new FirestorePlugin.FirestorePluginExecutor(clientCache);

        // When
        DatasourceStructure structure = executor.getStructure(
                        connection, serviceAccountDatasourceConfig("open-project", "{}", null))
                .block();

        // Then
        assertThat(structure.getTables()).isEmpty();
    }

    private static ActionConfiguration getDocumentAction() {
        Map<String, Object> formData = new HashMap<>();
        setDataValueSafelyInFormData(formData, COMMAND, "GET_DOCUMENT");
        setDataValueSafelyInFormData(formData, PATH, "initial/one");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);
        return actionConfiguration;
    }

    @Test
    void should_createTheClientOnThePluginThread_when_connectionIsCreated() {
        // Given
        AtomicReference<String> threadName = new AtomicReference<>();
        FirestoreClientCache clientCache = Mockito.mock(FirestoreClientCache.class);
        Mockito.when(clientCache.get(Mockito.any(), Mockito.any())).thenAnswer(invocation -> {
            threadName.set(Thread.currentThread().getName());
            return Mockito.mock(Firestore.class);
        });
        FirestorePlugin.FirestorePluginExecutor executor = new FirestorePlugin.FirestorePluginExecutor(clientCache);

        // When
        executor.datasourceCreate(serviceAccountDatasourceConfig("some-project", "{}", null))
                .block();

        // Then
        assertThat(threadName.get()).startsWith("boundedElastic");
    }

    @Test
    void should_returnValidationError_when_connectionIsCreatedWithoutCredentials() {
        // Given
        DatasourceConfiguration datasourceConfiguration = serviceAccountDatasourceConfig("some-project", null, null);

        // When
        Mono<Firestore> result = pluginExecutor.datasourceCreate(datasourceConfiguration);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(AppsmithPluginException.class)
                        .hasMessage(FirestoreErrorMessages.DS_MISSING_CLIENTJSON_ERROR_MSG))
                .verify(Duration.ofSeconds(10));
    }

    @Test
    void should_returnValidationError_when_datasourceIsTestedWithoutCredentials() {
        // Given
        DatasourceConfiguration datasourceConfiguration = serviceAccountDatasourceConfig("some-project", null, null);

        // When
        Mono<DatasourceTestResult> result = pluginExecutor.testDatasource(datasourceConfiguration);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(AppsmithPluginException.class)
                        .hasMessage(FirestoreErrorMessages.DS_MISSING_CLIENTJSON_ERROR_MSG))
                .verify(Duration.ofSeconds(10));
    }

    static Stream<Arguments> datasourceTestCalls() {
        return Stream.of(
                Arguments.of(
                        "one argument", (DatasourceTestCall) (executor, config) -> executor.testDatasource(config)),
                Arguments.of(
                        "flag on", (DatasourceTestCall) (executor, config) -> executor.testDatasource(config, true)),
                Arguments.of(
                        "flag off", (DatasourceTestCall) (executor, config) -> executor.testDatasource(config, false)));
    }

    @FunctionalInterface
    interface DatasourceTestCall {
        Mono<DatasourceTestResult> run(
                FirestorePlugin.FirestorePluginExecutor executor, DatasourceConfiguration datasourceConfiguration);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("datasourceTestCalls")
    void should_notUseTheClientCache_when_datasourceIsTested(String name, DatasourceTestCall testCall) {
        // Given
        FirestoreClientCache clientCache = Mockito.mock(FirestoreClientCache.class);
        FirestorePlugin.FirestorePluginExecutor spyExecutor =
                Mockito.spy(new FirestorePlugin.FirestorePluginExecutor(clientCache));
        DatasourceConfiguration datasourceConfiguration = serviceAccountDatasourceConfig("tested-project", "{}", null);
        Firestore client = Mockito.mock(Firestore.class);
        Mockito.doReturn(client).when(spyExecutor).createClient(datasourceConfiguration);

        // When
        testCall.run(spyExecutor, datasourceConfiguration).block();

        // Then
        Mockito.verifyNoInteractions(clientCache);
        Mockito.verify(client).listCollections();
    }

    @Test
    void should_returnTestResult_when_shuttingDownTheTestedClientFails() {
        // Given
        DatasourceConfiguration datasourceConfiguration =
                serviceAccountDatasourceConfig("shutdown-fails-project", "{}", null);
        Firestore client = Mockito.mock(Firestore.class);
        Mockito.doThrow(new IllegalStateException("shutdown failed"))
                .when(client)
                .shutdown();
        FirestorePlugin.FirestorePluginExecutor spyExecutor = Mockito.spy(pluginExecutor);
        Mockito.doReturn(client).when(spyExecutor).createClient(datasourceConfiguration);

        // When
        DatasourceTestResult result =
                spyExecutor.testDatasource(datasourceConfiguration).block();

        // Then
        assertThat(result.isSuccess()).isTrue();
    }

    static Stream<Arguments> listCollectionsOutcomes() {
        return Stream.of(
                Arguments.of("success", null),
                Arguments.of("firestore error", FirestoreException.forServerRejection(Status.NOT_FOUND, "Not found")),
                Arguments.of("unexpected error", new IllegalArgumentException("unexpected")));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("listCollectionsOutcomes")
    void should_shutDownClient_when_datasourceTestEnds(String outcome, RuntimeException listCollectionsError) {
        // Given
        DatasourceConfiguration datasourceConfiguration =
                serviceAccountDatasourceConfig("test-ends-project", "{}", null);
        Firestore client = Mockito.mock(Firestore.class);
        if (listCollectionsError != null) {
            Mockito.when(client.listCollections()).thenThrow(listCollectionsError);
        }
        FirestorePlugin.FirestorePluginExecutor spyExecutor = Mockito.spy(pluginExecutor);
        Mockito.doReturn(client).when(spyExecutor).createClient(datasourceConfiguration);

        // When
        spyExecutor
                .testDatasource(datasourceConfiguration)
                .onErrorResume(error -> Mono.empty())
                .block();

        // Then
        Mockito.verify(client, Mockito.timeout(5000)).shutdown();
    }

    @Test
    void should_shutDownClient_when_datasourceTestIsCancelled() throws InterruptedException {
        // Given
        DatasourceConfiguration datasourceConfiguration =
                serviceAccountDatasourceConfig("cancelled-project", "{}", null);
        CountDownLatch listing = new CountDownLatch(1);
        AtomicBoolean listingFinished = new AtomicBoolean();
        Firestore client = Mockito.mock(Firestore.class);
        Mockito.when(client.listCollections()).thenAnswer(invocation -> {
            listing.countDown();
            new CountDownLatch(1).await(5, TimeUnit.SECONDS);
            listingFinished.set(true);
            return Collections.emptyList();
        });
        FirestorePlugin.FirestorePluginExecutor spyExecutor = Mockito.spy(pluginExecutor);
        Mockito.doReturn(client).when(spyExecutor).createClient(datasourceConfiguration);
        Disposable test = spyExecutor.testDatasource(datasourceConfiguration).subscribe(result -> {}, error -> {});
        boolean wasRunning = listing.await(5, TimeUnit.SECONDS) && !listingFinished.get();

        // When
        test.dispose();

        // Then
        assertThat(wasRunning).isTrue();
        Mockito.verify(client, Mockito.timeout(5000)).shutdown();
    }

    @ParameterizedTest
    @ValueSource(strings = {"GET_DOCUMENT", "SET_DOCUMENT", "GET_COLLECTION", "ADD_TO_COLLECTION"})
    void should_returnStaleConnectionError_when_queryRunsOnShutDownClient(String command)
            throws NoSuchAlgorithmException {
        // Given
        Firestore connection = shutDownClient();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> formData = new HashMap<>();
        setDataValueSafelyInFormData(formData, COMMAND, command);
        setDataValueSafelyInFormData(formData, PATH, command.endsWith("COLLECTION") ? "initial" : "initial/one");
        setDataValueSafelyInFormData(formData, BODY, "{\"value\": 1}");
        actionConfiguration.setFormData(formData);

        // When
        Mono<ActionExecutionResult> result =
                pluginExecutor.executeParameterized(connection, new ExecuteActionDTO(), dsConfig, actionConfiguration);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(StaleConnectionException.class)
                        .hasMessage(FirestoreErrorMessages.CONNECTION_CLOSED_ERROR_MSG))
                .verify(Duration.ofSeconds(10));
    }

    @Test
    void should_returnStaleConnectionError_when_structureIsReadOnShutDownClient() throws NoSuchAlgorithmException {
        // Given
        Firestore connection = shutDownClient();

        // When
        Mono<DatasourceStructure> result = pluginExecutor.getStructure(connection, dsConfig);

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(StaleConnectionException.class)
                        .hasMessage(FirestoreErrorMessages.CONNECTION_CLOSED_ERROR_MSG))
                .verify(Duration.ofSeconds(10));
    }

    @Test
    void should_returnQueryError_when_illegalStateIsNotAShutDownClient() {
        // Given
        Firestore connection = Mockito.mock(Firestore.class);
        Mockito.when(connection.collection("initial")).thenThrow(new IllegalStateException("another problem"));
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> formData = new HashMap<>();
        setDataValueSafelyInFormData(formData, COMMAND, "GET_COLLECTION");
        setDataValueSafelyInFormData(formData, PATH, "initial");
        actionConfiguration.setFormData(formData);

        // When
        Mono<ActionExecutionResult> result =
                pluginExecutor.executeParameterized(connection, new ExecuteActionDTO(), dsConfig, actionConfiguration);

        // Then
        StepVerifier.create(result)
                .assertNext(executionResult -> {
                    assertThat(executionResult.getIsExecutionSuccess()).isFalse();
                    assertThat(executionResult.getPluginErrorDetails().getAppsmithErrorMessage())
                            .isEqualTo(FirestoreErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG);
                })
                .verifyComplete();
    }

    private Firestore shutDownClient() throws NoSuchAlgorithmException {
        String projectId = "shut-down-project";
        Firestore client = pluginExecutor.createClient(serviceAccountDatasourceConfig(
                projectId, serviceAccountJson(projectId, "sa@shut-down-project.iam.gserviceaccount.com"), null));
        client.shutdown();
        return client;
    }

    static Stream<String> invalidDatabaseIds() {
        return Stream.of(
                "My_DB!", // invalid characters
                "MyDb", // uppercase
                "abc", // 3 characters, below the minimum of 4
                "a".repeat(64), // 64 characters, above the maximum of 63
                "1abc", // leading digit
                "abc-", // trailing hyphen
                "f47ac10b-58cc-0372-8567-0e02b2c3d479" // UUID-like
                );
    }

    @ParameterizedTest
    @MethodSource("invalidDatabaseIds")
    void should_returnInvalidDatabaseIdError_when_databaseIdIsInvalid(String databaseId) {
        // Given
        DatasourceConfiguration datasourceConfiguration =
                serviceAccountDatasourceConfig("some-project", "{}", databaseId);

        // When
        Set<String> invalids = pluginExecutor.validateDatasource(datasourceConfiguration);

        // Then
        assertThat(invalids).contains(FirestoreErrorMessages.DS_INVALID_DATABASE_ID_ERROR_MSG);
    }

    static Stream<String> validOrDefaultDatabaseIds() {
        return Stream.of("my-db", "  my-db  ", "abcd", "a".repeat(63), "(default)", "", "  ");
    }

    @ParameterizedTest
    @MethodSource("validOrDefaultDatabaseIds")
    void should_returnNoErrors_when_databaseIdIsValidOrDefault(String databaseId) {
        // Given
        DatasourceConfiguration datasourceConfiguration =
                serviceAccountDatasourceConfig("some-project", "{}", databaseId);

        // When
        Set<String> invalids = pluginExecutor.validateDatasource(datasourceConfiguration);

        // Then
        assertThat(invalids).isEmpty();
    }

    @Test
    void should_returnDefaultDatabaseId_when_firstPropertyIsNull() {
        // Given
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        List<Property> properties = new ArrayList<>();
        properties.add(null);
        datasourceConfiguration.setProperties(properties);

        // When
        String databaseId = FirestorePlugin.FirestorePluginExecutor.resolveDatabaseId(datasourceConfiguration);

        // Then
        assertThat(databaseId).isEqualTo(FirestorePlugin.FirestorePluginExecutor.DEFAULT_DATABASE_ID);
    }

    static Stream<String> blankDatabaseUrls() {
        return Stream.of(null, "", "  ");
    }

    @ParameterizedTest
    @MethodSource("blankDatabaseUrls")
    void should_returnNoErrors_when_databaseUrlIsBlank(String databaseUrl) {
        // Given
        DatasourceConfiguration datasourceConfiguration = serviceAccountDatasourceConfig("some-project", "{}", null);
        datasourceConfiguration.setUrl(databaseUrl);

        // When
        Set<String> invalids = pluginExecutor.validateDatasource(datasourceConfiguration);

        // Then
        assertThat(invalids).isEmpty();
    }

    @ParameterizedTest
    @MethodSource("blankDatabaseUrls")
    void should_createConnection_when_databaseUrlIsBlank(String databaseUrl) throws NoSuchAlgorithmException {
        // Given
        String projectId = "no-url-project";
        String clientJson = serviceAccountJson(projectId, "sa@no-url-project.iam.gserviceaccount.com");
        DatasourceConfiguration datasourceConfiguration = serviceAccountDatasourceConfig(projectId, clientJson, null);
        datasourceConfiguration.setUrl(databaseUrl);

        // When
        Mono<Firestore> result = pluginExecutor.datasourceCreate(datasourceConfiguration);

        // Then
        StepVerifier.create(result)
                .assertNext(firestore ->
                        assertThat(firestore.getOptions().getProjectId()).isEqualTo(projectId))
                .verifyComplete();
    }

    static Stream<Arguments> connectionErrorsByDatabaseId() {
        return Stream.of(
                Arguments.of(null, FirestoreErrorMessages.DS_CONNECTION_FAILED_FOR_PROJECT_ID),
                Arguments.of("my-db", FirestoreErrorMessages.DS_CONNECTION_FAILED_FOR_DATABASE_ID));
    }

    @ParameterizedTest
    @MethodSource("connectionErrorsByDatabaseId")
    void should_returnConnectionErrorForConfiguredDatabase_when_listingCollectionsFails(
            String databaseId, String expectedError) {
        // Given
        DatasourceConfiguration datasourceConfiguration =
                serviceAccountDatasourceConfig("test-project-invalid", "{}", databaseId);
        Firestore unreachableFirestore = Mockito.mock(Firestore.class);
        Mockito.when(unreachableFirestore.listCollections())
                .thenThrow(FirestoreException.forServerRejection(Status.NOT_FOUND, "Not found"));
        FirestorePlugin.FirestorePluginExecutor spyExecutor = Mockito.spy(pluginExecutor);
        Mockito.doReturn(unreachableFirestore).when(spyExecutor).createClient(datasourceConfiguration);

        // When
        Mono<DatasourceTestResult> result = spyExecutor.testDatasource(datasourceConfiguration);

        // Then
        StepVerifier.create(result)
                .assertNext(datasourceTestResult ->
                        assertThat(datasourceTestResult.getInvalids()).containsExactly(expectedError))
                .verifyComplete();
    }

    @Test
    public void testDatasource_withCorrectCredentials_returnsWithoutInvalids() {

        FirestorePlugin.FirestorePluginExecutor spyExecutor = Mockito.spy(pluginExecutor);

        // The plugin shuts down the client it tests, so do not pass the shared one.
        Mockito.doReturn(emulatorConnection()).when(spyExecutor).createClient(dsConfig);
        final Mono<DatasourceTestResult> testDatasourceMono = spyExecutor.testDatasource(dsConfig);

        StepVerifier.create(testDatasourceMono)
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                    assertTrue(datasourceTestResult.isSuccess());
                    assertTrue(datasourceTestResult.getInvalids().isEmpty());
                })
                .verifyComplete();
    }

    @Test
    public void testDatasource_withValidProjectId_WithoutMetaDataAccess() {

        // This test validates the Firestore connection, not the ProjectId given by the user
        FirestorePlugin.FirestorePluginExecutor spyExecutor = Mockito.spy(pluginExecutor);
        // The plugin shuts down the client it tests, so do not pass the shared one.
        Mockito.doReturn(emulatorConnection()).when(spyExecutor).createClient(dsConfig);
        final Mono<DatasourceTestResult> testDatasourceMono = spyExecutor.testDatasource(dsConfig);

        StepVerifier.create(testDatasourceMono)
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                    assertTrue(datasourceTestResult.isSuccess());
                    assertTrue(datasourceTestResult.getInvalids().isEmpty());
                    assertFalse(datasourceTestResult.getMessages().isEmpty());
                    assertTrue(datasourceTestResult.getMessages().stream()
                            .anyMatch(s -> s.equals(FirestoreErrorMessages.META_DATA_ACCESS_MISSING_MESSAGE)));
                })
                .verifyComplete();
    }

    @Test
    public void testDatasource_withInvalidProjectId_WithMetaDataAccess() {

        // This validates firestore connection and the ProjectId given by the user
        FirestorePlugin.FirestorePluginExecutor spyExecutor = Mockito.spy(pluginExecutor);
        // We cannot use the datasource create flow here as the client authentication json is unknown. Hence, using the
        // default emulator credentials
        FirebaseOptions firebaseOptions = FirebaseOptions.builder()
                .setProjectId("test-project-invalid")
                .setDatabaseUrl(emulator.getEmulatorEndpoint())
                .setCredentials(new EmulatorCredentials())
                .build();
        FirebaseApp.initializeApp(firebaseOptions);
        Firestore firestore = FirestoreClient.getFirestore();
        Mockito.doReturn(firestore).when(spyExecutor).createClient(dsConfig);
        final Mono<DatasourceTestResult> testDatasourceMono = spyExecutor.testDatasource(dsConfig);

        StepVerifier.create(testDatasourceMono)
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                    assertFalse(datasourceTestResult.isSuccess());
                    assertFalse(datasourceTestResult.getInvalids().isEmpty());
                    assertTrue(datasourceTestResult.getInvalids().stream()
                            .anyMatch(s -> s.equals(FirestoreErrorMessages.DS_CONNECTION_FAILED_FOR_PROJECT_ID)));
                })
                .verifyComplete();
    }

    @Test
    public void testGetDocumentsInCollectionOrdering() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_COLLECTION");
        setDataValueSafelyInFormData(configMap, ORDER_BY, "[\"firm\", \"name\"]");
        setDataValueSafelyInFormData(configMap, LIMIT_DOCUMENTS, "15");
        setDataValueSafelyInFormData(configMap, PATH, "pagination");
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    List<Map<String, Object>> results = (List) result.getBody();
                    assertEquals(15, results.size());

                    final List<Object> names =
                            results.stream().map(d -> d.get("name")).collect(Collectors.toList());
                    assertEquals(
                            List.of(
                                    "Lowell Reese",
                                    "Rufus Green",
                                    "Michele Cole",
                                    "Alvin Zimmerman",
                                    "Della Moore",
                                    "Josefina Perkins",
                                    "Meghan Steele",
                                    "Allen Arnold",
                                    "Jeremy Mille",
                                    "Eunice Hines",
                                    "Israel Broc",
                                    "Harriet Myers",
                                    "Larry Frazie",
                                    "Gerard Neal",
                                    "Marco Murray"),
                            names);

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(COMMAND, "GET_COLLECTION", null, null, null));
                    expectedRequestParams.add(new RequestParamDTO(
                            ACTION_CONFIGURATION_PATH,
                            PluginUtils.getDataValueSafelyFromFormData(
                                    actionConfiguration.getFormData(), PATH, STRING_TYPE),
                            null,
                            null,
                            null)); // Path
                    expectedRequestParams.add(
                            new RequestParamDTO(ORDER_BY, "[\"firm\", \"name\"]", null, null, null)); // Order by
                    expectedRequestParams.add(new RequestParamDTO(START_AFTER, "{}", null, null, null)); // Start after
                    expectedRequestParams.add(new RequestParamDTO(END_BEFORE, "{}", null, null, null)); // End before
                    expectedRequestParams.add(new RequestParamDTO(LIMIT_DOCUMENTS, "15", null, null, null)); // Limit
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testGetDocumentsInCollectionOrdering2() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_COLLECTION");
        setDataValueSafelyInFormData(configMap, ORDER_BY, "[\"firm\", \"-name\"]");
        setDataValueSafelyInFormData(configMap, LIMIT_DOCUMENTS, "15");
        setDataValueSafelyInFormData(configMap, PATH, "pagination");
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    List<Map<String, Object>> results = (List) result.getBody();
                    assertEquals(15, results.size());

                    final List<Object> names =
                            results.stream().map(d -> d.get("name")).collect(Collectors.toList());
                    assertEquals(
                            List.of(
                                    "Rufus Green",
                                    "Lowell Reese",
                                    "Michele Cole",
                                    "Della Moore",
                                    "Alvin Zimmerman",
                                    "Meghan Steele",
                                    "Josefina Perkins",
                                    "Jeremy Mille",
                                    "Allen Arnold",
                                    "Israel Broc",
                                    "Eunice Hines",
                                    "Larry Frazie",
                                    "Harriet Myers",
                                    "Marco Murray",
                                    "Gerard Neal"),
                            names);
                })
                .verifyComplete();
    }

    @Test
    public void testWhereConditional() {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_COLLECTION");

        List<Object> children = new ArrayList<>();

        /*
         * - get all documents where category == test.
         * - this returns 2 documents.
         */
        children.add(Map.of(
                "key", "{{Input1.text}}",
                "condition", "EQ",
                "value", "{{Input2.text}}"));

        /*
         * - get all documents where name == two.
         * - Of the two documents returned by above condition, this will narrow it down to one.
         */
        children.add(Map.of(
                "key", "{{Input3.text}}",
                "condition", "EQ",
                "value", "{{Input4.text}}"));

        Map<String, Object> whereMap = new HashMap<>();
        whereMap.put(CHILDREN, children);
        setDataValueSafelyInFormData(configMap, WHERE, whereMap);
        setDataValueSafelyInFormData(configMap, PATH, "initial");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        List<Param> params = new ArrayList<>();
        Param param = new Param();
        param.setKey("Input1.text");
        param.setValue("category");
        params.add(param);
        param = new Param();
        param.setKey("Input2.text");
        param.setValue("test");
        params.add(param);
        param = new Param();
        param.setKey("Input3.text");
        param.setValue("name");
        params.add(param);
        param = new Param();
        param.setKey("Input4.text");
        param.setValue("two");
        params.add(param);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(params);
        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, executeActionDTO, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    List<Map<String, Object>> results = (List) result.getBody();
                    assertEquals(1, results.size());

                    final Map<String, Object> second =
                            results.stream().findFirst().orElse(null);
                    assertNotNull(second);
                    assertEquals("two", second.remove("name"));
                    assertTrue((Boolean) second.remove("isPlural"));
                    assertEquals(2L, second.remove("value"));
                    assertEquals(Map.of("path", "initial/one", "id", "one"), second.remove("ref"));
                    assertEquals(new GeoPoint(-90, 90), second.remove("geo"));
                    assertNotNull(second.remove("dt"));
                    assertEquals(
                            "abc def",
                            ((Blob) second.remove("bytes")).toByteString().toStringUtf8());
                    assertNull(second.remove("null-ref"));
                    assertEquals(Map.of("id", "two", "path", "initial/two"), second.remove("_ref"));
                    assertEquals("test", second.remove("category"));
                    assertEquals(Collections.emptyMap(), second);
                })
                .verifyComplete();
    }

    @Test
    public void testNumberWhereConditional() {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_COLLECTION");

        List<Object> children = new ArrayList<>();
        children.add(Map.of(
                "key", "{{Input1.text}}",
                "condition", "EQ",
                "value", "{{Input2.text}}"));

        Map<String, Object> whereMap = new HashMap<>();
        whereMap.put(CHILDREN, children);
        setDataValueSafelyInFormData(configMap, WHERE, whereMap);
        setDataValueSafelyInFormData(configMap, PATH, "numeric");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        List params = new ArrayList();
        Param param = new Param();
        param.setKey("Input1.text");
        param.setValue("score");
        params.add(param);
        param = new Param();
        param.setKey("Input2.text");
        param.setValue("99");
        params.add(param);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(params);
        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, executeActionDTO, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    List<Map<String, Object>> results = (List) result.getBody();
                    assertEquals(1, results.size());
                })
                .verifyComplete();
    }

    @Test
    public void testBooleanWhereConditional() {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_COLLECTION");

        List<Object> children = new ArrayList<>();
        children.add(Map.of(
                "key", "{{Input1.text}}",
                "condition", "EQ",
                "value", "{{Input2.text}}"));

        Map<String, Object> whereMap = new HashMap<>();
        whereMap.put(CHILDREN, children);
        setDataValueSafelyInFormData(configMap, WHERE, whereMap);
        setDataValueSafelyInFormData(configMap, PATH, "numeric");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        List params = new ArrayList();
        Param param = new Param();
        param.setKey("Input1.text");
        param.setValue("isPlural");
        params.add(param);
        param = new Param();
        param.setKey("Input2.text");
        param.setValue("true");
        params.add(param);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(params);
        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, executeActionDTO, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    List<Map<String, Object>> results = (List) result.getBody();
                    assertEquals(1, results.size());
                })
                .verifyComplete();
    }

    @Test
    public void testDateWhereConditional() {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_COLLECTION");

        List<Object> children = new ArrayList<>();
        children.add(Map.of(
                "key", "{{Input1.text}}",
                "condition", "EQ",
                "value", "{{Input2.text}}"));

        Map<String, Object> whereMap = new HashMap<>();
        whereMap.put(CHILDREN, children);
        setDataValueSafelyInFormData(configMap, WHERE, whereMap);
        setDataValueSafelyInFormData(configMap, PATH, "numeric");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        List params = new ArrayList();
        Param param = new Param();
        param.setKey("Input1.text");
        param.setValue("dob");
        params.add(param);
        param = new Param();
        param.setKey("Input2.text");
        param.setValue("2000-03-24");
        params.add(param);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(params);
        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, executeActionDTO, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    List<Map<String, Object>> results = (List) result.getBody();
                    assertEquals(1, results.size());
                })
                .verifyComplete();
    }

    @Test
    public void testTimeStampWhereConditional() {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_COLLECTION");

        List<Object> children = new ArrayList<>();
        children.add(Map.of(
                "key", "{{Input1.text}}",
                "condition", "EQ",
                "value", "{{Input2.text}}"));

        Map<String, Object> whereMap = new HashMap<>();
        whereMap.put(CHILDREN, children);
        setDataValueSafelyInFormData(configMap, WHERE, whereMap);
        setDataValueSafelyInFormData(configMap, PATH, "numeric");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        List params = new ArrayList();
        Param param = new Param();
        param.setKey("Input1.text");
        param.setValue("start");
        params.add(param);
        param = new Param();
        param.setKey("Input2.text");
        param.setValue("2018-09-01 09:01:15");
        params.add(param);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(params);
        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, executeActionDTO, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    List<Map<String, Object>> results = (List) result.getBody();
                    assertEquals(1, results.size());
                })
                .verifyComplete();
    }

    @Test
    public void testArrayContainsWhereConditional() {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_COLLECTION");

        List<Object> children = new ArrayList<>();
        children.add(Map.of(
                "key", "{{Input1.text}}",
                "condition", "ARRAY_CONTAINS",
                "value", "{{Input2.text}}"));

        Map<String, Object> whereMap = new HashMap<>();
        whereMap.put(CHILDREN, children);
        setDataValueSafelyInFormData(configMap, WHERE, whereMap);
        setDataValueSafelyInFormData(configMap, PATH, "info");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        List params = new ArrayList();
        Param param = new Param();
        param.setKey("Input1.text");
        param.setValue("kids");
        params.add(param);
        param = new Param();
        param.setKey("Input2.text");
        param.setValue("Ally");
        params.add(param);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(params);
        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, executeActionDTO, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    List<Map<String, Object>> results = (List) result.getBody();
                    assertEquals(1, results.size());
                })
                .verifyComplete();
    }

    @Test
    public void testArrayContainsNumberWhereConditional() {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_COLLECTION");

        List<Object> children = new ArrayList<>();
        children.add(Map.of(
                "key", "{{Input1.text}}",
                "condition", "ARRAY_CONTAINS",
                "value", "{{Input2.text}}"));

        Map<String, Object> whereMap = new HashMap<>();
        whereMap.put(CHILDREN, children);
        setDataValueSafelyInFormData(configMap, WHERE, whereMap);
        setDataValueSafelyInFormData(configMap, PATH, "info");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        List params = new ArrayList();
        Param param = new Param();
        param.setKey("Input1.text");
        param.setValue("phone_numbers");
        params.add(param);
        param = new Param();
        param.setKey("Input2.text");
        param.setValue("333");
        params.add(param);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(params);
        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, executeActionDTO, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    List<Map<String, Object>> results = (List) result.getBody();
                    assertEquals(1, results.size());
                })
                .verifyComplete();
    }

    @Test
    public void testArrayContainsAnyWhereConditional() {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_COLLECTION");

        List<Object> children = new ArrayList<>();
        children.add(Map.of(
                "key", "{{Input1.text}}",
                "condition", "ARRAY_CONTAINS_ANY",
                "value", "{{Input2.text}}"));

        Map<String, Object> whereMap = new HashMap<>();
        whereMap.put(CHILDREN, children);
        setDataValueSafelyInFormData(configMap, WHERE, whereMap);
        setDataValueSafelyInFormData(configMap, PATH, "info");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        List params = new ArrayList();
        Param param = new Param();
        param.setKey("Input1.text");
        param.setValue("cars");
        params.add(param);
        param = new Param();
        param.setKey("Input2.text");
        param.setValue("[\"Dodge\",\"cars\"]");
        params.add(param);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(params);
        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, executeActionDTO, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    List<Map<String, Object>> results = (List) result.getBody();
                    assertEquals(1, results.size());
                })
                .verifyComplete();
    }

    @Test
    public void testArrayInWhereConditional() {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_COLLECTION");

        List<Object> children = new ArrayList<>();
        children.add(Map.of(
                "key", "{{Input1.text}}",
                "condition", "IN",
                "value", "{{Input2.text}}"));

        Map<String, Object> whereMap = new HashMap<>();
        whereMap.put(CHILDREN, children);
        setDataValueSafelyInFormData(configMap, WHERE, whereMap);
        setDataValueSafelyInFormData(configMap, PATH, "initial");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        List params = new ArrayList();
        Param param = new Param();
        param.setKey("Input1.text");
        param.setValue("name");
        params.add(param);
        param = new Param();
        param.setKey("Input2.text");
        param.setValue("[\"two\",\"third\",\"sharon\"]");
        params.add(param);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(params);
        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, executeActionDTO, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    List<Map<String, Object>> results = (List) result.getBody();
                    assertEquals(2, results.size());
                })
                .verifyComplete();
    }

    @Test
    public void testPaginationWithWhereConditional() {
        /** */
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_COLLECTION");

        List<Object> children = new ArrayList<>();
        children.add(Map.of(
                "key", "age",
                "condition", "GTE",
                "value", "24"));

        Map<String, Object> whereMap = new HashMap<>();
        whereMap.put(CHILDREN, children);
        setDataValueSafelyInFormData(configMap, WHERE, whereMap);
        setDataValueSafelyInFormData(configMap, PATH, "pagination");
        setDataValueSafelyInFormData(configMap, ORDER_BY, "[\"age\"]");
        setDataValueSafelyInFormData(configMap, LIMIT_DOCUMENTS, "4");

        final ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();

        // Fetch data for page 1
        Mono<ActionExecutionResult> page1Mono = pluginExecutor
                .executeParameterized(firestoreConnection, executeActionDTO, dsConfig, actionConfiguration)
                .cache();

        // Fetch data for page 2 by clicking on the next button
        Mono<ActionExecutionResult> page2Mono = page1Mono
                .flatMap(page1 -> getNextOrPrevPage(page1, PaginationField.NEXT, "4"))
                .cache();

        var pagesMono = Mono.zip(page1Mono, page2Mono);

        StepVerifier.create(pagesMono)
                .assertNext(resultPages -> {
                    final ActionExecutionResult firstPageResult = resultPages.getT1();
                    final ActionExecutionResult secondPageResult = resultPages.getT2();

                    assertTrue(firstPageResult.getIsExecutionSuccess());

                    List<Map<String, Object>> firstResults = (List) firstPageResult.getBody();
                    assertEquals(4, firstResults.size());

                    // assert the where clause result
                    final List<Object> names =
                            firstResults.stream().map(d -> d.get("name")).collect(Collectors.toList());
                    assertEquals(List.of("Alvin Zimmerman", "Meghan Steele", "Israel Broc", "Eunice Hines"), names);

                    List<Map<String, Object>> secondResults = (List) secondPageResult.getBody();
                    assertEquals(4, secondResults.size());

                    // assert the where clause result
                    final List<Object> secondNames =
                            secondResults.stream().map(d -> d.get("name")).collect(Collectors.toList());
                    assertEquals(List.of("Harriet Myers", "Lowell Reese", "Gerard Neal", "Allen Arnold"), secondNames);
                })
                .verifyComplete();
    }

    @Test
    public void testUpdateDocumentWithFieldValueTimestamp() {

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "UPDATE_DOCUMENT");
        setDataValueSafelyInFormData(configMap, TIMESTAMP_VALUE_PATH, "[\"value\"]");
        setDataValueSafelyInFormData(configMap, PATH, "changing/to-update");
        setDataValueSafelyInFormData(configMap, BODY, "{\n" + "    \"value\": 2\n" + "}");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    try {
                        final DocumentSnapshot documentSnapshot = firestoreConnection
                                .document("changing/to-update")
                                .get()
                                .get();
                        assertTrue(documentSnapshot.exists());

                        try {
                            /*
                             * - If the value against the key "value" has been replaced by a valid timestamp, then
                             *   the getString method here must fail.
                             */
                            documentSnapshot.getString("value");
                        } catch (Exception e) {
                            assertTrue(e.getMessage().contains("Timestamp cannot be cast to class java.lang.String"));
                        }
                    } catch (NullPointerException | InterruptedException | ExecutionException e) {
                        e.printStackTrace();
                        throw new RuntimeException(e);
                    }
                })
                .verifyComplete();
    }

    /*
     * - First delete key.
     * - Then verify that the key does not exist in the list of keys returned by reading the document.
     */
    @Test
    public void testUpdateDocumentWithFieldValueDelete() {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "UPDATE_DOCUMENT");
        setDataValueSafelyInFormData(configMap, DELETE_KEY_PATH, "[\"value\"]");
        setDataValueSafelyInFormData(configMap, PATH, "changing/to-update");
        setDataValueSafelyInFormData(configMap, BODY, "{\n" + "    \"value\": 2\n" + "}");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);

        /*
         * - Delete key.
         */
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(COMMAND, "UPDATE_DOCUMENT", null, null, null));
                    expectedRequestParams.add(new RequestParamDTO(
                            ACTION_CONFIGURATION_PATH,
                            PluginUtils.getDataValueSafelyFromFormData(
                                    actionConfiguration.getFormData(), PATH, STRING_TYPE),
                            null,
                            null,
                            null)); // Path
                    expectedRequestParams.add(
                            new RequestParamDTO(DELETE_KEY_PATH, "[\"value\"]", null, null, null)); // Method
                    expectedRequestParams.add(new RequestParamDTO(
                            ACTION_CONFIGURATION_BODY,
                            PluginUtils.getDataValueSafelyFromFormData(
                                    actionConfiguration.getFormData(), BODY, STRING_TYPE),
                            null,
                            null,
                            null)); // Body
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();

        configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, PATH, "changing/to-update");
        setDataValueSafelyInFormData(configMap, BODY, "");
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_DOCUMENT");
        resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);

        /*
         * - Verify that the key does not exist in the list of keys returned by reading the document.
         */
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    final Map<String, Object> doc = (Map) result.getBody();
                    assertFalse(doc.keySet().contains("value"));
                })
                .verifyComplete();
    }

    @Test
    public void testFieldValueDeleteWithUnsupportedAction() {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "CREATE_DOCUMENT");
        setDataValueSafelyInFormData(configMap, DELETE_KEY_PATH, "[\"value\"]");
        setDataValueSafelyInFormData(configMap, PATH, "changing/to-update");
        setDataValueSafelyInFormData(configMap, BODY, "{\n" + "    \"value\": 2\n" + "}");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());

                    String expectedErrorMessage = FirestoreErrorMessages.UNEXPECTED_PROPERTY_DELETE_KEY_PATH_ERROR_MSG;
                    assertTrue(expectedErrorMessage.equals(
                            result.getPluginErrorDetails().getAppsmithErrorMessage()));
                    assertEquals(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getTitle(), result.getTitle());
                })
                .verifyComplete();
    }

    @Test
    public void testFieldValueTimestampWithUnsupportedAction() {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "GET_DOCUMENT");
        setDataValueSafelyInFormData(configMap, TIMESTAMP_VALUE_PATH, "[\"value\"]");
        setDataValueSafelyInFormData(configMap, PATH, "changing/to-update");
        setDataValueSafelyInFormData(configMap, BODY, "{\n" + "    \"value\": 2\n" + "}");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());

                    String expectedErrorMessage = FirestoreErrorMessages.UNEXPECTED_PROPERTY_TIMESTAMP_ERROR_MSG;
                    assertTrue(expectedErrorMessage.equals(
                            result.getPluginErrorDetails().getAppsmithErrorMessage()));
                    assertEquals(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getTitle(), result.getTitle());
                })
                .verifyComplete();
    }

    @Test
    public void testFieldValueDeleteWithBadArgument() {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "UPDATE_DOCUMENT");
        setDataValueSafelyInFormData(configMap, DELETE_KEY_PATH, "value");
        setDataValueSafelyInFormData(configMap, PATH, "changing/to-update");
        setDataValueSafelyInFormData(configMap, BODY, "{\n" + "    \"value\": 2\n" + "}");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());

                    String expectedErrorMessage = FirestoreErrorMessages.FAILED_TO_PARSE_DELETE_KEY_PATH_ERROR_MSG;
                    assertTrue(expectedErrorMessage.equals(
                            result.getPluginErrorDetails().getAppsmithErrorMessage()));
                    assertEquals(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getTitle(), result.getTitle());
                })
                .verifyComplete();
    }

    @Test
    public void testFieldValueTimestampWithBadArgument() {
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, COMMAND, "UPDATE_DOCUMENT");
        setDataValueSafelyInFormData(configMap, TIMESTAMP_VALUE_PATH, "value");
        setDataValueSafelyInFormData(configMap, PATH, "changing/to-update");
        setDataValueSafelyInFormData(configMap, BODY, "{\n" + "    \"value\": 2\n" + "}");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());

                    String expectedErrorMessage = FirestoreErrorMessages.FAILED_TO_PARSE_TIMESTAMP_VALUE_PATH_ERROR_MSG;
                    assertTrue(expectedErrorMessage.equals(
                            result.getPluginErrorDetails().getAppsmithErrorMessage()));
                    assertEquals(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getTitle(), result.getTitle());
                })
                .verifyComplete();
    }

    // TODO: fix it.
    @Test
    public void testDynamicBindingSubstitutionInActionConfiguration() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath("{{Input1.text}}");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("method", "GET_COLLECTION"));
        pluginSpecifiedTemplates.add(new Property("order", null));
        pluginSpecifiedTemplates.add(new Property("limit", null));
        Property whereProperty = new Property("where", null);
        whereProperty.setValue(new ArrayList<>());
        /*
         * - get all documents where category == test.
         * - this returns 2 documents.
         */
        ((List) whereProperty.getValue())
                .add(Map.of(
                        "path", "{{Input2.text}}",
                        "operator", "EQ",
                        "value", "{{Input3.text}}"));

        pluginSpecifiedTemplates.add(whereProperty);
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        List params = new ArrayList();
        Param param = new Param();
        param.setKey("Input1.text");
        param.setValue("initial");
        params.add(param);
        param = new Param();
        param.setKey("Input2.text");
        param.setValue("category");
        params.add(param);
        param = new Param();
        param.setKey("Input3.text");
        param.setValue("test");
        params.add(param);
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(params);

        // Substitute dynamic binding values
        pluginExecutor.prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, null);

        // check if dynamic binding values have been substituted correctly
        assertEquals("initial", actionConfiguration.getPath());
        assertEquals(
                "category",
                ((Map) ((List) actionConfiguration
                                        .getPluginSpecifiedTemplates()
                                        .get(3)
                                        .getValue())
                                .get(0))
                        .get("path"));
        assertEquals(
                "test",
                ((Map) ((List) actionConfiguration
                                        .getPluginSpecifiedTemplates()
                                        .get(3)
                                        .getValue())
                                .get(0))
                        .get("value"));
    }

    @Test
    public void testJsonSmartSubstitution() {
        /**
         *  Create a new document in Firestore. This command should fail without the smart JSON substitution because
         *  a normal mustache replacement will create an invalid JSON.
         *  Please note that the smart substitution is by default set to `true` hence we haven't explicitly set it here.
         */
        Map<String, Object> configMap1 = new HashMap<>();
        setDataValueSafelyInFormData(configMap1, COMMAND, "CREATE_DOCUMENT");
        setDataValueSafelyInFormData(configMap1, PATH, "test/json_smart_substitution_test");
        setDataValueSafelyInFormData(
                configMap1,
                BODY,
                "{\n" + "    \"firstName\":{{Input1.text}},\n"
                        + "    \"lastName\":{{Input2.text}},\n"
                        + "    \"locationPreferences\":{{Input3.text}},\n"
                        + "    \"testScores\":{{Input4.text}}\n"
                        + "}");

        ActionConfiguration actionConfiguration1 = new ActionConfiguration();
        actionConfiguration1.setFormData(configMap1);

        List params = new ArrayList();
        Param param = new Param();
        param.setKey("Input1.text");
        param.setValue("Jon");
        param.setClientDataType(ClientDataType.STRING);
        params.add(param);
        param = new Param();
        param.setKey("Input2.text");
        param.setValue("Von Neumann");
        param.setClientDataType(ClientDataType.STRING);
        params.add(param);
        param = new Param();
        param.setKey("Input3.text");
        param.setValue("[\"Zuric\", \"Gottingen\"]");
        param.setClientDataType(ClientDataType.ARRAY);
        params.add(param);
        param = new Param();
        param.setKey("Input4.text");
        param.setValue("{\"computational complexity\": 100, \"math\": 100}");
        param.setClientDataType(ClientDataType.OBJECT);
        params.add(param);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        executeActionDTO.setParams(params);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(
                firestoreConnection, executeActionDTO, dsConfig, actionConfiguration1);

        StepVerifier.create(resultMono)
                .assertNext(result -> assertTrue(result.getIsExecutionSuccess()))
                .verifyComplete();

        /* Fetch previously created document to check if correct value was saved */
        Map<String, Object> configMap2 = new HashMap();
        setDataValueSafelyInFormData(configMap2, COMMAND, "GET_DOCUMENT");
        setDataValueSafelyInFormData(configMap2, PATH, "test/json_smart_substitution_test");

        ActionConfiguration actionConfiguration2 = new ActionConfiguration();
        actionConfiguration2.setFormData(configMap2);

        Mono<ActionExecutionResult> resultMono2 = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration2);

        StepVerifier.create(resultMono2)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    final Map<String, Object> first = (Map) result.getBody();
                    assertEquals("Jon", first.get("firstName"));
                    assertEquals("Von Neumann", first.get("lastName"));
                    assertEquals("Zuric", ((List) first.get("locationPreferences")).get(0));
                    assertEquals("Gottingen", ((List) first.get("locationPreferences")).get(1));
                    assertEquals(
                            "100",
                            ((Map) first.get("testScores"))
                                    .get("computational complexity")
                                    .toString());
                    assertEquals(
                            "100", ((Map) first.get("testScores")).get("math").toString());
                })
                .verifyComplete();

        /* Delete the document added as part of this test */
        Map<String, Object> configMap3 = new HashMap<>();
        setDataValueSafelyInFormData(configMap3, COMMAND, "DELETE_DOCUMENT");
        setDataValueSafelyInFormData(configMap3, PATH, "test/json_smart_substitution_test");

        ActionConfiguration actionConfiguration3 = new ActionConfiguration();
        actionConfiguration3.setFormData(configMap3);

        Mono<ActionExecutionResult> resultMono3 = pluginExecutor.executeParameterized(
                firestoreConnection, new ExecuteActionDTO(), dsConfig, actionConfiguration3);

        StepVerifier.create(resultMono3)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    try {
                        final DocumentSnapshot documentSnapshot = firestoreConnection
                                .document("test" + "/json_smart_substitution_test")
                                .get()
                                .get();
                        assertFalse(documentSnapshot.exists());
                    } catch (InterruptedException | ExecutionException e) {
                        e.printStackTrace();
                    }
                })
                .verifyComplete();
    }

    @Test
    public void verifyUniquenessOfFirestorePluginErrorCode() {
        assert (Arrays.stream(FirestorePluginError.values())
                        .map(FirestorePluginError::getAppErrorCode)
                        .distinct()
                        .count()
                == FirestorePluginError.values().length);

        assert (Arrays.stream(FirestorePluginError.values())
                        .map(FirestorePluginError::getAppErrorCode)
                        .filter(appErrorCode -> appErrorCode.length() != 11 || !appErrorCode.startsWith("PE-FST"))
                        .collect(Collectors.toList())
                        .size()
                == 0);
    }
}
