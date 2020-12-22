package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.google.cloud.NoCredentials;
import com.google.cloud.ServiceOptions;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import lombok.extern.slf4j.Slf4j;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.FirestoreEmulatorContainer;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
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
        firestoreConnection.document("initial/two").set(Map.of("value", 2, "name", "two", "isPlural", true)).get();
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
                    assertTrue(((Map<String, Object>) result.getBody()).entrySet().stream().allMatch(entry -> {
                        Object value = entry.getValue();
                        switch (entry.getKey()) {
                            case "name":
                                return "one".equals(value);
                            case "isPlural":
                                return Boolean.FALSE.equals(value);
                            case "value":
                                return value.equals(1L);
                            default:
                                return false;
                        }
                    }));
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
                    assertEquals(2, ((List) result.getBody()).size());
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
