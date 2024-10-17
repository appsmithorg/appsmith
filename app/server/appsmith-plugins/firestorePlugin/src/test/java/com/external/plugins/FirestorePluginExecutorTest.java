package com.external.plugins;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.google.cloud.NoCredentials;
import com.google.cloud.ServiceOptions;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.cloud.firestore.GeoPoint;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.FirestoreEmulatorContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.*;

@Testcontainers
public class FirestorePluginExecutorTest {

    FirestorePlugin.FirestorePluginExecutor pluginExecutor = new FirestorePlugin.FirestorePluginExecutor();

    @Container
    public static final FirestoreEmulatorContainer emulator = new FirestoreEmulatorContainer(
            DockerImageName.parse("gcr.io/google.com/cloudsdktool/cloud-sdk:316.0.0-emulators"));

    static Firestore firestoreConnection;

    static DatasourceConfiguration dsConfig = new DatasourceConfiguration();

    @BeforeAll
    public static void setUp() throws ExecutionException, InterruptedException {
        firestoreConnection = FirestoreOptions.newBuilder()
                .setHost(emulator.getEmulatorEndpoint())
                .setCredentials(NoCredentials.getInstance())
                .setRetrySettings(ServiceOptions.getNoRetrySettings())
                .setProjectId("test-project")
                .build()
                .getService();

        dsConfig.setUrl(emulator.getEmulatorEndpoint());
    }

    @Test
    public void testMethodAddToCollection() {
        CollectionReference collection = firestoreConnection.collection("test-collection");
        Map<String, Object> mapBody = new HashMap<>();
        mapBody.put("timestamp", Map.of("seconds", 1625097600, "nanoSeconds", 123456789));
        mapBody.put("geo", Map.of("latitude", 37.7749, "longitude", -122.4194));
        mapBody.put("ref", "initial/one");

        Mono<ActionExecutionResult> resultMono = pluginExecutor.methodAddToCollection(collection, mapBody);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());

                    Map<String, Object> resultBody = (Map<String, Object>) result.getBody();
                    String documentId = (String) resultBody.get("id");
                    assertNotNull(documentId);

                    // Validate data types
                    try {
                        Map<String, Object> savedData =
                                collection.document(documentId).get().get().getData();
                        assertNotNull(savedData);
                        assertTrue(savedData.get("geo") instanceof GeoPoint);
                        assertTrue(savedData.get("ref") instanceof com.google.cloud.firestore.DocumentReference);
                    } catch (InterruptedException | ExecutionException e) {
                        fail("Failed to fetch saved document data.");
                    }
                })
                .verifyComplete();
    }
}
