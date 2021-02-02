package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.google.cloud.NoCredentials;
import com.google.cloud.ServiceOptions;
import com.google.cloud.firestore.Blob;
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

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

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

        firestoreConnection.document("initial/one").set(Map.of("value", 1, "name", "one", "isPlural", false)).get();
        final Map<String, Object> twoData = new HashMap<>(Map.of(
                "value", 2,
                "name", "two",
                "isPlural", true,
                "geo", new GeoPoint(-90, 90),
                "dt", FieldValue.serverTimestamp(),
                "ref", firestoreConnection.document("initial/one"),
                "bytes", Blob.fromBytes("abc def".getBytes(StandardCharsets.UTF_8))
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
                .execute(firestoreConnection, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    final Map<String, Object> first = (Map) result.getBody();
                    assertEquals("one", first.remove("name"));
                    assertFalse((Boolean) first.remove("isPlural"));
                    assertEquals(1L, first.remove("value"));
                    assertEquals(Collections.emptyMap(), first);
                })
                .verifyComplete();
    }

    @Test
    public void testGetSingleDocument2() {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath("initial/two");
        actionConfiguration.setPluginSpecifiedTemplates(List.of(new Property("method", "GET_DOCUMENT")));

        Mono<ActionExecutionResult> resultMono = pluginExecutor
                .execute(firestoreConnection, dsConfig, actionConfiguration);

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
                .execute(firestoreConnection, dsConfig, actionConfiguration);

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
                .execute(firestoreConnection, dsConfig, actionConfiguration);

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
                .execute(firestoreConnection, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
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
                .execute(firestoreConnection, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
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
                .execute(firestoreConnection, dsConfig, actionConfiguration);

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
                .execute(firestoreConnection, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    try {
                        final DocumentSnapshot documentSnapshot = firestoreConnection.document("changing/to-delete").get().get();
                        assertFalse(documentSnapshot.exists());
                    } catch (InterruptedException | ExecutionException e) {
                        e.printStackTrace();
                    }
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
                .execute(firestoreConnection, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(firestoreConnection.document("changing/" + ((Map) result.getBody()).get("id")));
                })
                .verifyComplete();
    }

}
