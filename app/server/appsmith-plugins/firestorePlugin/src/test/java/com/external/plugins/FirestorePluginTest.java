package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.PaginationField;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.RequestParamDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.NoCredentials;
import com.google.cloud.ServiceOptions;
import com.google.cloud.firestore.Blob;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.cloud.firestore.GeoPoint;
import lombok.extern.slf4j.Slf4j;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.FirestoreEmulatorContainer;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple3;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_PATH;
import static com.appsmith.external.helpers.PluginUtils.getActionConfigurationPropertyPath;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

/**
 * Unit tests for the FirestorePlugin
 */
@Slf4j
public class FirestorePluginTest {

    static FirestorePlugin.FirestorePluginExecutor pluginExecutor = new FirestorePlugin.FirestorePluginExecutor();

    @ClassRule
    public static final FirestoreEmulatorContainer emulator = new FirestoreEmulatorContainer(
            DockerImageName.parse("gcr.io/google.com/cloudsdktool/cloud-sdk:316.0.0-emulators")
    );

    static Firestore firestoreConnection;

    static DatasourceConfiguration dsConfig = new DatasourceConfiguration();

    @BeforeClass
    public static void setUp() throws ExecutionException, InterruptedException {
        firestoreConnection = FirestoreOptions.newBuilder()
                .setHost(emulator.getEmulatorEndpoint())
                .setCredentials(NoCredentials.getInstance())
                .setRetrySettings(ServiceOptions.getNoRetrySettings())
                .setProjectId("test-project")
                .build()
                .getService();

        firestoreConnection.document("initial/one").set(Map.of("value", 1, "name", "one", "isPlural", false,
                "category", "test")).get();
        final Map<String, Object> twoData = new HashMap<>(Map.of(
                "value", 2,
                "name", "two",
                "isPlural", true,
                "geo", new GeoPoint(-90, 90),
                "dt", FieldValue.serverTimestamp(),
                "ref", firestoreConnection.document("initial/one"),
                "bytes", Blob.fromBytes("abc def".getBytes(StandardCharsets.UTF_8)),
                "category", "test"
        ));
        twoData.put("null-ref", null);
        firestoreConnection.document("initial/two").set(twoData).get();
        firestoreConnection.document("initial/inner-ref").set(Map.of(
                "name", "third",
                "data", Map.of(
                        "ref", firestoreConnection.document("initial/one"),
                        "isAwesome", false,
                        "anotherRef", firestoreConnection.document("initial/two")
                ),
                "ref-list", List.of(
                        firestoreConnection.document("initial/one"),
                        firestoreConnection.document("initial/two")
                )
        )).get();

        firestoreConnection.document("changing/to-update").set(Map.of("value", 1)).get();
        firestoreConnection.document("changing/to-delete").set(Map.of("value", 1)).get();

        final CollectionReference paginationCol = firestoreConnection.collection("pagination");
        paginationCol.add(Map.of("n", 1, "name", "Michele Cole", "firm", "Appsmith")).get();
        paginationCol.add(Map.of("n", 2, "name", "Meghan Steele", "firm", "Google")).get();
        paginationCol.add(Map.of("n", 3, "name", "Della Moore", "firm", "Facebook")).get();
        paginationCol.add(Map.of("n", 4, "name", "Eunice Hines", "firm", "Microsoft")).get();
        paginationCol.add(Map.of("n", 5, "name", "Harriet Myers", "firm", "Netflix")).get();
        paginationCol.add(Map.of("n", 6, "name", "Lowell Reese", "firm", "Apple")).get();
        paginationCol.add(Map.of("n", 7, "name", "Gerard Neal", "firm", "Oracle")).get();
        paginationCol.add(Map.of("n", 8, "name", "Allen Arnold", "firm", "IBM")).get();
        paginationCol.add(Map.of("n", 9, "name", "Josefina Perkins", "firm", "Google")).get();
        paginationCol.add(Map.of("n", 10, "name", "Alvin Zimmerman", "firm", "Facebook")).get();
        paginationCol.add(Map.of("n", 11, "name", "Israel Broc", "firm", "Microsoft")).get();
        paginationCol.add(Map.of("n", 12, "name", "Larry Frazie", "firm", "Netflix")).get();
        paginationCol.add(Map.of("n", 13, "name", "Rufus Green", "firm", "Apple")).get();
        paginationCol.add(Map.of("n", 14, "name", "Marco Murray", "firm", "Oracle")).get();
        paginationCol.add(Map.of("n", 15, "name", "Jeremy Mille", "firm", "IBM")).get();

        dsConfig.setUrl(emulator.getEmulatorEndpoint());
        DBAuth auth = new DBAuth();
        auth.setUsername("test-project");
        auth.setPassword("");
        dsConfig.setAuthentication(auth);
    }

    @Test
    public void testGetSingleDocument() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath("initial/one");
        actionConfiguration.setPluginSpecifiedTemplates(List.of(new Property("method", "GET_DOCUMENT")));

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);

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
                    expectedRequestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(0),
                            "GET_DOCUMENT", null, null, null)); // Method
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, actionConfiguration.getPath(),
                            null, null, null)); // Path
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testGetSingleDocument2() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath("initial/two");
        actionConfiguration.setPluginSpecifiedTemplates(List.of(new Property("method", "GET_DOCUMENT")));

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);

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
                    assertEquals("abc def", ((Blob) doc.remove("bytes")).toByteString().toStringUtf8());
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
        actionConfiguration.setPath("initial/inner-ref");
        actionConfiguration.setPluginSpecifiedTemplates(List.of(new Property("method", "GET_DOCUMENT")));

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    final Map<String, Object> doc = (Map) result.getBody();
                    assertEquals("third", doc.remove("name"));
                    assertEquals(Map.of(
                            "ref", Map.of("path", "initial/one", "id", "one"),
                            "isAwesome", false,
                            "anotherRef", Map.of("path", "initial/two", "id", "two")
                    ), doc.remove("data"));
                    assertEquals(List.of(
                            Map.of("path", "initial/one", "id", "one"),
                            Map.of("path", "initial/two", "id", "two")
                    ), doc.remove("ref-list"));
                    assertEquals(Map.of("id", "inner-ref", "path", "initial/inner-ref"), doc.remove("_ref"));
                    assertEquals(Collections.emptyMap(), doc);
                })
                .verifyComplete();
    }

    @Test
    public void testGetDocumentsInCollection() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath("initial");
        actionConfiguration.setPluginSpecifiedTemplates(List.of(new Property("method", "GET_COLLECTION")));

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    List<Map<String, Object>> results = (List) result.getBody();
                    assertEquals(3, results.size());

                    final Map<String, Object> first = results.stream().filter(d -> "one".equals(d.get("name"))).findFirst().orElse(null);
                    assertNotNull(first);
                    assertEquals("one", first.remove("name"));
                    assertFalse((Boolean) first.remove("isPlural"));
                    assertEquals(1L, first.remove("value"));
                    assertEquals(Map.of("id", "one", "path", "initial/one"), first.remove("_ref"));
                    assertEquals("test", first.remove("category"));
                    assertEquals(Collections.emptyMap(), first);

                    final Map<String, Object> second = results.stream().filter(d -> "two".equals(d.get("name"))).findFirst().orElse(null);
                    assertNotNull(second);
                    assertEquals("two", second.remove("name"));
                    assertTrue((Boolean) second.remove("isPlural"));
                    assertEquals(2L, second.remove("value"));
                    assertEquals(Map.of("path", "initial/one", "id", "one"), second.remove("ref"));
                    assertEquals(new GeoPoint(-90, 90), second.remove("geo"));
                    assertNotNull(second.remove("dt"));
                    assertEquals("abc def", ((Blob) second.remove("bytes")).toByteString().toStringUtf8());
                    assertNull(second.remove("null-ref"));
                    assertEquals(Map.of("id", "two", "path", "initial/two"), second.remove("_ref"));
                    assertEquals("test", second.remove("category"));
                    assertEquals(Collections.emptyMap(), second);

                    final Map<String, Object> third = results.stream().filter(d -> "third".equals(d.get("name"))).findFirst().orElse(null);
                    assertNotNull(third);
                    assertEquals("third", third.remove("name"));
                    assertEquals(Map.of(
                            "ref", Map.of("path", "initial/one", "id", "one"),
                            "isAwesome", false,
                            "anotherRef", Map.of("path", "initial/two", "id", "two")
                    ), third.remove("data"));
                    assertEquals(List.of(
                            Map.of("path", "initial/one", "id", "one"),
                            Map.of("path", "initial/two", "id", "two")
                    ), third.remove("ref-list"));
                    assertEquals(Map.of("id", "inner-ref", "path", "initial/inner-ref"), third.remove("_ref"));
                    assertEquals(Collections.emptyMap(), third);
                })
                .verifyComplete();
    }

    @Test
    public void testSetNewDocument() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath("test/new_with_set");
        actionConfiguration.setBody("{\n" +
                "    \"firstName\": \"test\",\n" +
                "    \"lastName\":\"lastTest\"\n" +
                "}");

        actionConfiguration.setPluginSpecifiedTemplates(List.of(new Property("method", "SET_DOCUMENT")));

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(0),
                            "SET_DOCUMENT", null, null, null)); // Method
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, actionConfiguration.getPath(),
                            null, null, null)); // Path
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_BODY,
                            actionConfiguration.getBody(), null, null, null)); // Body
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testCreateDocument() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath("test/new_with_create");
        actionConfiguration.setBody("{\n" +
                "    \"firstName\": \"test\",\n" +
                "    \"lastName\":\"lastTest\"\n" +
                "}");

        actionConfiguration.setPluginSpecifiedTemplates(List.of(new Property("method", "CREATE_DOCUMENT")));

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(0),
                            "CREATE_DOCUMENT", null, null, null)); // Method
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, actionConfiguration.getPath(),
                            null, null, null)); // Path
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_BODY,
                            actionConfiguration.getBody(), null, null, null)); // Body
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testUpdateDocument() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath("changing/to-update");
        actionConfiguration.setBody("{\n" +
                "    \"value\": 2\n" +
                "}");

        actionConfiguration.setPluginSpecifiedTemplates(List.of(new Property("method", "UPDATE_DOCUMENT")));

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    try {
                        final DocumentSnapshot documentSnapshot = firestoreConnection.document("changing/to-update").get().get();
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
        actionConfiguration.setPath("changing/to-delete");

        actionConfiguration.setPluginSpecifiedTemplates(List.of(new Property("method", "DELETE_DOCUMENT")));

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    try {
                        final DocumentSnapshot documentSnapshot = firestoreConnection.document("changing/to-delete").get().get();
                        assertFalse(documentSnapshot.exists());
                    } catch (InterruptedException | ExecutionException e) {
                        e.printStackTrace();
                    }

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(0),
                            "DELETE_DOCUMENT", null, null, null)); // Method
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, actionConfiguration.getPath(),
                            null, null, null)); // Path
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testAddToCollection() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath("changing");

        actionConfiguration.setPluginSpecifiedTemplates(List.of(new Property("method", "ADD_TO_COLLECTION")));

        actionConfiguration.setBody("{\n" +
                "  \"question\": \"What is the answer to life, universe and everything else?\",\n" +
                "  \"answer\": 42\n" +
                "}");

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(firestoreConnection.document("changing/" + ((Map) result.getBody()).get("id")));

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(0),
                            "ADD_TO_COLLECTION", null, null, null)); // Method
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, actionConfiguration.getPath(),
                            null, null, null)); // Path
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_BODY,
                            actionConfiguration.getBody(), null, null, null)); // Body
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testPagination() {
        final ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath("pagination");
        actionConfiguration.setPluginSpecifiedTemplates(List.of(
                new Property("method", "GET_COLLECTION"),
                new Property("order", "[\"n\"]"),
                new Property("limit", "5")
        ));

        final ObjectMapper objectMapper = new ObjectMapper();

        Mono<Tuple3<ActionExecutionResult, ActionExecutionResult, ActionExecutionResult>> pagesMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration)
                .flatMap(result -> {
                    List<Map<String, Object>> results = (List) result.getBody();
                    final Map<String, Object> first = results.get(0);
                    final Map<String, Object> last = results.get(results.size() - 1);

                    final ExecuteActionDTO execDetails = new ExecuteActionDTO();
                    execDetails.setPaginationField(PaginationField.NEXT);

                    final ActionConfiguration actionConfiguration1 = new ActionConfiguration();
                    actionConfiguration1.setPath(actionConfiguration.getPath());
                    try {
                        actionConfiguration1.setPluginSpecifiedTemplates(List.of(
                                new Property("method", "GET_COLLECTION"),
                                new Property("order", "[\"n\"]"),
                                new Property("limit", "5"),
                                new Property(),
                                new Property(),
                                new Property(),
                                new Property("startAfter", objectMapper.writeValueAsString(last)),
                                new Property("endBefore", objectMapper.writeValueAsString(first))
                        ));
                    } catch (JsonProcessingException e) {
                        e.printStackTrace();
                        return Mono.error(e);
                    }

                    return Mono.zip(
                            Mono.just(result),
                            pluginExecutor.executeParameterized(firestoreConnection, execDetails, dsConfig, actionConfiguration1)
                    );
                })
                .flatMap(twoPagesMono -> {
                    final ActionExecutionResult page1 = twoPagesMono.getT1();
                    final ActionExecutionResult page2 = twoPagesMono.getT2();

                    List<Map<String, Object>> results = (List) page2.getBody();
                    final Map<String, Object> first = results.get(0);
                    final Map<String, Object> last = results.get(results.size() - 1);

                    final ExecuteActionDTO execDetails = new ExecuteActionDTO();
                    execDetails.setPaginationField(PaginationField.PREV);

                    final ActionConfiguration actionConfiguration1 = new ActionConfiguration();
                    actionConfiguration1.setPath(actionConfiguration.getPath());
                    try {
                        actionConfiguration1.setPluginSpecifiedTemplates(List.of(
                                new Property("method", "GET_COLLECTION"),
                                new Property("order", "[\"n\"]"),
                                new Property("limit", "5"),
                                new Property(),
                                new Property(),
                                new Property(),
                                new Property("startAfter", objectMapper.writeValueAsString(last)),
                                new Property("endBefore", objectMapper.writeValueAsString(first))
                        ));
                    } catch (JsonProcessingException e) {
                        e.printStackTrace();
                        return Mono.error(e);
                    }

                    return Mono.zip(
                            Mono.just(page1),
                            Mono.just(page2),
                            pluginExecutor.executeParameterized(firestoreConnection, execDetails, dsConfig, actionConfiguration1)
                    );
                });

        StepVerifier.create(pagesMono)
                .assertNext(resultPages -> {
                    final ActionExecutionResult firstPageResult = resultPages.getT1();
                    final ActionExecutionResult secondPageResult = resultPages.getT2();
                    final ActionExecutionResult firstPageResultAgain = resultPages.getT3();

                    assertTrue(firstPageResult.getIsExecutionSuccess());

                    List<Map<String, Object>> firstResults = (List) firstPageResult.getBody();
                    assertEquals(5, firstResults.size());
                    assertEquals(
                            "[1, 2, 3, 4, 5]",
                            firstResults.stream().map(m -> m.get("n").toString()).collect(Collectors.toList()).toString()
                    );

                    List<Map<String, Object>> secondResults = (List) secondPageResult.getBody();
                    assertEquals(5, secondResults.size());
                    assertEquals(
                            "[6, 7, 8, 9, 10]",
                            secondResults.stream().map(m -> m.get("n").toString()).collect(Collectors.toList()).toString()
                    );

                    List<Map<String, Object>> firstResultsAgain = (List) firstPageResultAgain.getBody();
                    assertEquals(5, firstResultsAgain.size());
                    assertEquals(
                            "[1, 2, 3, 4, 5]",
                            firstResultsAgain.stream().map(m -> m.get("n").toString()).collect(Collectors.toList()).toString()
                    );

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
                            "Validation failed for field 'Service Account Credentials'. Please check the " +
                                    "value provided in the 'Service Account Credentials' field.",
                            error.getMessage());

                    // Check that the error does not get logged externally.
                    assertFalse(AppsmithErrorAction.LOG_EXTERNALLY.equals(((AppsmithPluginException)error).getError().getErrorAction()));
                })
                .verify();
    }

    @Test
    public void testGetDocumentsInCollectionOrdering() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath("pagination");
        actionConfiguration.setPluginSpecifiedTemplates(List.of(
                new Property("method", "GET_COLLECTION"),
                new Property("order", "[\"firm\", \"name\"]"),
                new Property("limit", "15")
        ));

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    List<Map<String, Object>> results = (List) result.getBody();
                    assertEquals(15, results.size());

                    final List<Object> names = results.stream().map(d -> d.get("name")).collect(Collectors.toList());
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
                                    "Marco Murray"
                            ),
                            names
                    );

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(0),
                            "GET_COLLECTION", null, null, null)); // Method
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, actionConfiguration.getPath(),
                            null, null, null)); // Path
                    expectedRequestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(1),
                            "[\"firm\", \"name\"]", null, null, null)); // Order by
                    expectedRequestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(6), "{}", null,
                            null, null)); // Start after
                    expectedRequestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(7), "{}", null,
                            null, null)); // End before
                    expectedRequestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(2), "15", null,
                            null, null)); // Limit
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());

                })
                .verifyComplete();
    }

    @Test
    public void testGetDocumentsInCollectionOrdering2() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath("pagination");
        actionConfiguration.setPluginSpecifiedTemplates(List.of(
                new Property("method", "GET_COLLECTION"),
                new Property("order", "[\"firm\", \"-name\"]"),
                new Property("limit", "15")
        ));

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    List<Map<String, Object>> results = (List) result.getBody();
                    assertEquals(15, results.size());

                    final List<Object> names = results.stream().map(d -> d.get("name")).collect(Collectors.toList());
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
                                    "Gerard Neal"
                            ),
                            names
                    );

                })
                .verifyComplete();
    }

    @Test
    public void testWhereConditional() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath("initial");
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
        ((List)whereProperty.getValue()).add(new HashMap<String, Object>() {{
            put("path", "{{Input1.text}}");
            put("operator", "EQ");
            put("value", "{{Input2.text}}");
        }});

        /*
         * - get all documents where name == two.
         * - Of the two documents returned by above condition, this will narrow it down to one.
         */
        ((List)whereProperty.getValue()).add(new HashMap<String, Object>() {{
            put("path", "{{Input3.text}}");
            put("operator", "EQ");
            put("value", "{{Input4.text}}");
        }});

        pluginSpecifiedTemplates.add(whereProperty);
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        List params = new ArrayList();
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
        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, executeActionDTO, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());

                    List<Map<String, Object>> results = (List) result.getBody();
                    assertEquals(1, results.size());

                    final Map<String, Object> second = results.stream().findFirst().orElse(null);
                    assertNotNull(second);
                    assertEquals("two", second.remove("name"));
                    assertTrue((Boolean) second.remove("isPlural"));
                    assertEquals(2L, second.remove("value"));
                    assertEquals(Map.of("path", "initial/one", "id", "one"), second.remove("ref"));
                    assertEquals(new GeoPoint(-90, 90), second.remove("geo"));
                    assertNotNull(second.remove("dt"));
                    assertEquals("abc def", ((Blob) second.remove("bytes")).toByteString().toStringUtf8());
                    assertNull(second.remove("null-ref"));
                    assertEquals(Map.of("id", "two", "path", "initial/two"), second.remove("_ref"));
                    assertEquals("test", second.remove("category"));
                    assertEquals(Collections.emptyMap(), second);
                })
                .verifyComplete();
    }

    @Test
    public void testUpdateDocumentWithFieldValueTimestamp() {
        List<Property> properties = new ArrayList<>();
        properties.add(new Property("method", "UPDATE_DOCUMENT")); // index 0
        properties.add(null); // index 1
        properties.add(null); // index 2
        properties.add(null); // index 3
        properties.add(null); // index 4
        properties.add(null); // index 5
        properties.add(null); // index 6
        properties.add(null); // index 7
        properties.add(new Property("key path", "[\"value\"]")); // index 8 - path for timestampServer fieldValue.

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPluginSpecifiedTemplates(properties);
        actionConfiguration.setPath("changing/to-update");
        actionConfiguration.setBody("{\n" +
                "    \"value\": 2\n" +
                "}");

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    try {
                        final DocumentSnapshot documentSnapshot = firestoreConnection.document("changing/to-update").get().get();
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
        List<Property> properties = new ArrayList<>();
        properties.add(new Property("method", "UPDATE_DOCUMENT")); // index 0
        properties.add(null); // index 1
        properties.add(null); // index 2
        properties.add(null); // index 3
        properties.add(null); // index 4
        properties.add(null); // index 5
        properties.add(null); // index 6
        properties.add(null); // index 7
        properties.add(null); // index 8
        properties.add(new Property("key path", "[\"value\"]")); // index 9 - path for delete fieldValue.

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPluginSpecifiedTemplates(properties);
        actionConfiguration.setPath("changing/to-update");
        actionConfiguration.setBody("{\n" +
                "    \"value\": 2\n" +
                "}");

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);

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
                    expectedRequestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(0),
                            "UPDATE_DOCUMENT", null, null, null)); // Method
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_PATH, actionConfiguration.getPath(),
                            null, null, null)); // Path
                    expectedRequestParams.add(new RequestParamDTO(getActionConfigurationPropertyPath(9),
                            "[\"value\"]", null, null, null)); // Method
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_BODY,
                            actionConfiguration.getBody(), null, null, null)); // Body
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();

        actionConfiguration.setPath("changing/to-update");
        actionConfiguration.setBody("");
        actionConfiguration.setPluginSpecifiedTemplates(List.of(new Property("method", "GET_DOCUMENT")));

        resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);

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
        List<Property> properties = new ArrayList<>();
        properties.add(new Property("method", "CREATE_DOCUMENT")); // index 0
        properties.add(null); // index 1
        properties.add(null); // index 2
        properties.add(null); // index 3
        properties.add(null); // index 4
        properties.add(null); // index 5
        properties.add(null); // index 6
        properties.add(null); // index 7
        properties.add(null); // index 8
        properties.add(new Property("key path", "[\"value\"]")); // index 9 - path for delete fieldValue.

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPluginSpecifiedTemplates(properties);
        actionConfiguration.setPath("changing/to-update");
        actionConfiguration.setBody("{\n" +
                "    \"value\": 2\n" +
                "}");

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());

                    String expectedErrorMessage = "Appsmith has found an unexpected query form property - 'Delete Key " +
                            "Value Pair Path'. Please reach out to Appsmith customer support to resolve this.";
                    assertTrue(expectedErrorMessage.equals(result.getBody()));
                    assertEquals(AppsmithPluginError.PLUGIN_ERROR.getTitle(), result.getTitle());
                })
                .verifyComplete();

    }

    @Test
    public void testFieldValueTimestampWithUnsupportedAction() {
        List<Property> properties = new ArrayList<>();
        properties.add(new Property("method", "GET_DOCUMENT")); // index 0
        properties.add(null); // index 1
        properties.add(null); // index 2
        properties.add(null); // index 3
        properties.add(null); // index 4
        properties.add(null); // index 5
        properties.add(null); // index 6
        properties.add(null); // index 7
        properties.add(new Property("key path", "[\"value\"]")); // index 8 - path for serverTimestamp fieldValue.

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPluginSpecifiedTemplates(properties);
        actionConfiguration.setPath("changing/to-update");
        actionConfiguration.setBody("{\n" +
                "    \"value\": 2\n" +
                "}");

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());

                    String expectedErrorMessage = "Appsmith has found an unexpected query form property - 'Timestamp " +
                            "Value Path'. Please reach out to Appsmith customer support to resolve this.";
                    assertTrue(expectedErrorMessage.equals(result.getBody()));
                    assertEquals(AppsmithPluginError.PLUGIN_ERROR.getTitle(), result.getTitle());
                })
                .verifyComplete();
    }

    @Test
    public void testFieldValueDeleteWithBadArgument() {
        List<Property> properties = new ArrayList<>();
        properties.add(new Property("method", "UPDATE_DOCUMENT")); // index 0
        properties.add(null); // index 1
        properties.add(null); // index 2
        properties.add(null); // index 3
        properties.add(null); // index 4
        properties.add(null); // index 5
        properties.add(null); // index 6
        properties.add(null); // index 7
        properties.add(null); // index 8
        properties.add(new Property("key path", "value")); // index 9 - path for delete fieldValue.

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPluginSpecifiedTemplates(properties);
        actionConfiguration.setPath("changing/to-update");
        actionConfiguration.setBody("{\n" +
                "    \"value\": 2\n" +
                "}");

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertFalse(result.getIsExecutionSuccess());

                    String expectedErrorMessage = "Appsmith failed to parse the query editor form field 'Delete Key " +
                            "Value Pair Path'. Please check out Appsmith's documentation to find the correct syntax.";
                    assertTrue(expectedErrorMessage.equals(result.getBody()));
                    assertEquals(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getTitle(), result.getTitle());
                })
                .verifyComplete();
    }

    @Test
    public void testFieldValueTimestampWithBadArgument() {
        List<Property> properties = new ArrayList<>();
        properties.add(new Property("method", "UPDATE_DOCUMENT")); // index 0
        properties.add(null); // index 1
        properties.add(null); // index 2
        properties.add(null); // index 3
        properties.add(null); // index 4
        properties.add(null); // index 5
        properties.add(null); // index 6
        properties.add(null); // index 7
        properties.add(new Property("key path", "value")); // index 8 - path for serverTimestamp fieldValue.

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPluginSpecifiedTemplates(properties);
        actionConfiguration.setPath("changing/to-update");
        actionConfiguration.setBody("{\n" +
                "    \"value\": 2\n" +
                "}");

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .executeParameterized(firestoreConnection, null, dsConfig, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {

                    assertFalse(result.getIsExecutionSuccess());

                    String expectedErrorMessage = "Appsmith failed to parse the query editor form field 'Timestamp " +
                            "Value Path'. Please check out Appsmith's documentation to find the correct syntax.";
                    assertTrue(expectedErrorMessage.equals(result.getBody()));
                    assertEquals(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getTitle(), result.getTitle());
                })
                .verifyComplete();
    }

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
        ((List)whereProperty.getValue()).add(new HashMap<String, Object>() {{
            put("path", "{{Input2.text}}");
            put("operator", "EQ");
            put("value", "{{Input3.text}}");
        }});

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
        pluginExecutor
                .prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, null);

        // check if dynamic binding values have been substituted correctly
        assertEquals("initial", actionConfiguration.getPath());
        assertEquals("category",
                ((Map)((List)actionConfiguration.getPluginSpecifiedTemplates().get(3).getValue()).get(0)).get(
                        "path"));
        assertEquals("test",
                ((Map)((List)actionConfiguration.getPluginSpecifiedTemplates().get(3).getValue()).get(0)).get(
                        "value"));
    }
}
