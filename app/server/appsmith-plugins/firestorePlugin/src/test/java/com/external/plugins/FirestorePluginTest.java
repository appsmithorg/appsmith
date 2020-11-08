package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.google.cloud.firestore.Firestore;
import lombok.extern.slf4j.Slf4j;
import org.junit.Assert;
import org.junit.Test;
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

    private DatasourceConfiguration createDatasourceConfiguration() {
        return null;
    }

    @Test
    public void testConnectFirestore() {

        Mono<Firestore> dsConnectionMono = pluginExecutor.datasourceCreate(null);

        StepVerifier.create(dsConnectionMono)
                .assertNext(Assert::assertNotNull)
                .verifyComplete();
    }

    @Test
    public void testExecuteFirestoreQuery() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        Property methodProp = new Property();
        methodProp.setKey("method");
        methodProp.setValue("set");
        Property collectionProp = new Property();
        collectionProp.setKey("collection");
        collectionProp.setValue("test");
        Property docProp = new Property();
        docProp.setKey("documentKey");
        docProp.setValue("alovelace");
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
