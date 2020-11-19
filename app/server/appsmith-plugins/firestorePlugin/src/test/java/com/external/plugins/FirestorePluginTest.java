package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.google.cloud.NoCredentials;
import com.google.cloud.ServiceOptions;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import lombok.extern.slf4j.Slf4j;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.FirestoreEmulatorContainer;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

/**
 * Unit tests for the FirestorePlugin
 */
@Slf4j
public class FirestorePluginTest {

    FirestorePlugin.FirestorePluginExecutor pluginExecutor = new FirestorePlugin.FirestorePluginExecutor();

    private static final String SERVICE_ACCOUNT = "";

    @ClassRule
    public static final FirestoreEmulatorContainer emulator = new FirestoreEmulatorContainer(
            DockerImageName.parse("gcr.io/google.com/cloudsdktool/cloud-sdk:316.0.0-emulators")
    );

    static Firestore firestore;

    @BeforeClass
    public static void setUp() {
        FirestoreOptions options = FirestoreOptions.newBuilder()
                .setHost(emulator.getEmulatorEndpoint())
                .setCredentials(NoCredentials.getInstance())
                .setRetrySettings(ServiceOptions.getNoRetrySettings())
                .setProjectId("test-project")
                .build();
        firestore = options.getService();
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl(emulator.getEmulatorEndpoint());
        datasourceConfiguration.setAuthentication(new AuthenticationDTO());
        datasourceConfiguration.getAuthentication().setUsername("test-project");
        datasourceConfiguration.getAuthentication().setPassword(SERVICE_ACCOUNT);
        return datasourceConfiguration;
    }

    @Test
    public void testConnectFirestore() {

        Mono<Firestore> dsConnectionMono = pluginExecutor.datasourceCreate(createDatasourceConfiguration());

        StepVerifier.create(dsConnectionMono)
                .assertNext(Assert::assertNotNull)
                .verifyComplete();
    }

    @Test
    public void testExecuteFirestoreQuery() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        Property methodProp = new Property("method", "set");
        Property collectionProp = new Property("collection", "test");
        Property docProp = new Property("documentKey", "alovelace");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("{\n" +
                "    \"firstName\": \"test\",\n" +
                "    \"lastName\":\"lastTest\"\n" +
                "}");
        actionConfiguration.setBodyFormData(List.of(methodProp, collectionProp, docProp));

        Mono<Firestore> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        Mono<ActionExecutionResult> actionExecutionResultMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(actionExecutionResultMono)
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                })
                .verifyComplete();
    }

}
