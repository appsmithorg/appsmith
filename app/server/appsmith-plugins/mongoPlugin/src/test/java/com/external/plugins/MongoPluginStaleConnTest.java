package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.SSLDetails;
import com.mongodb.MongoSocketWriteException;
import com.mongodb.reactivestreams.client.ListCollectionNamesPublisher;
import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoDatabase;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.reactivestreams.Subscriber;
import org.reactivestreams.Subscription;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

/**
 * Unit tests for MongoPlugin
 */
@Testcontainers
public class MongoPluginStaleConnTest {
    MongoPlugin.MongoPluginExecutor pluginExecutor = new MongoPlugin.MongoPluginExecutor(ObservationRegistry.NOOP);

    private static String address;
    private static Integer port;

    @SuppressWarnings("rawtypes")
    @Container
    public static MongoDBContainer mongoContainer = MongoTestDBContainerManager.getMongoDBForTest();

    @BeforeAll
    public static void setUp() {
        address = mongoContainer.getHost();
        port = mongoContainer.getFirstMappedPort();
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(address);
        endpoint.setPort(port.longValue());

        Connection connection = new Connection();
        connection.setMode(Connection.Mode.READ_WRITE);
        connection.setType(Connection.Type.DIRECT);
        connection.setDefaultDatabaseName("test");
        connection.setSsl(new SSLDetails());
        connection.getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setConnection(connection);
        dsConfig.setEndpoints(List.of(endpoint));

        return dsConfig;
    }

    @Test
    public void testStaleConnectionOnIllegalStateExceptionOnQueryExecution() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap, BODY, "{\n" + "      find: \"address\",\n" + "      limit: 10,\n" + "    }");
        actionConfiguration.setFormData(configMap);

        MongoClient spyMongoClient = spy(MongoClient.class);
        MongoDatabase spyMongoDatabase = spy(MongoDatabase.class);
        doReturn(spyMongoDatabase).when(spyMongoClient).getDatabase(anyString());
        doReturn(Mono.error(new IllegalStateException())).when(spyMongoDatabase).runCommand(any());

        Mono<ActionExecutionResult> resultMono =
                pluginExecutor.executeCommon(spyMongoClient, dsConfig, actionConfiguration, new ArrayList<>());
        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof StaleConnectionException)
                .verify();
    }

    @Test
    public void testStaleConnectionOnMongoSocketWriteExceptionOnQueryExecution() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setDataValueSafelyInFormData(configMap, COMMAND, "RAW");
        setDataValueSafelyInFormData(
                configMap, BODY, "{\n" + "      find: \"address\",\n" + "      limit: 10,\n" + "    }");
        actionConfiguration.setFormData(configMap);

        MongoClient spyMongoClient = spy(MongoClient.class);
        MongoDatabase spyMongoDatabase = spy(MongoDatabase.class);
        doReturn(spyMongoDatabase).when(spyMongoClient).getDatabase(anyString());
        doReturn(Mono.error(new MongoSocketWriteException("", null, null)))
                .when(spyMongoDatabase)
                .runCommand(any());

        Mono<ActionExecutionResult> resultMono =
                pluginExecutor.executeCommon(spyMongoClient, dsConfig, actionConfiguration, new ArrayList<>());
        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof StaleConnectionException)
                .verify();
    }

    @Test
    public void testStaleConnectionOnIllegalStateExceptionOnGetStructure() {
        MongoClient spyMongoClient = spy(MongoClient.class);
        MongoDatabase spyMongoDatabase = spy(MongoDatabase.class);
        doReturn(spyMongoDatabase).when(spyMongoClient).getDatabase(anyString());
        // Mock the ListCollectionNamesPublisher
        ListCollectionNamesPublisher mockPublisher = mock(ListCollectionNamesPublisher.class);

        // Create a mock subscription
        Subscription mockSubscription = mock(Subscription.class);

        // Simulate an error when calling listCollectionNames
        when(spyMongoDatabase.listCollectionNames()).thenReturn(mockPublisher);
        // Mock the subscribe method to simulate an error
        doAnswer(invocation -> {
                    // Extract the Subscriber passed to the subscribe method
                    Subscriber<?> subscriber = invocation.getArgument(0);

                    subscriber.onSubscribe(mockSubscription); // Provide a subscription
                    // Call the Subscriber's onError method to simulate an error
                    subscriber.onError(new IllegalStateException());

                    return null; // Since subscribe returns void
                })
                .when(mockPublisher)
                .subscribe(any());

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<DatasourceStructure> structureMono = pluginExecutor.getStructure(spyMongoClient, dsConfig, null);
        StepVerifier.create(structureMono)
                .expectErrorMatches(throwable -> throwable instanceof StaleConnectionException)
                .verify();
    }

    @Test
    public void testStaleConnectionOnMongoSocketWriteExceptionOnGetStructure() {
        MongoClient spyMongoClient = spy(MongoClient.class);
        MongoDatabase spyMongoDatabase = spy(MongoDatabase.class);
        doReturn(spyMongoDatabase).when(spyMongoClient).getDatabase(anyString());
        // Mock the ListCollectionNamesPublisher
        ListCollectionNamesPublisher mockPublisher = mock(ListCollectionNamesPublisher.class);

        // Create a mock subscription
        Subscription mockSubscription = mock(Subscription.class);

        // Simulate an error when calling listCollectionNames
        when(spyMongoDatabase.listCollectionNames()).thenReturn(mockPublisher);
        // Mock the subscribe method to simulate an error
        doAnswer(invocation -> {
                    // Extract the Subscriber passed to the subscribe method
                    Subscriber<?> subscriber = invocation.getArgument(0);

                    subscriber.onSubscribe(mockSubscription); // Provide a subscription
                    // Call the Subscriber's onError method to simulate an error
                    subscriber.onError(new MongoSocketWriteException("", null, null));

                    return null; // Since subscribe returns void
                })
                .when(mockPublisher)
                .subscribe(any());

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<DatasourceStructure> structureMono = pluginExecutor.getStructure(spyMongoClient, dsConfig, null);
        StepVerifier.create(structureMono)
                .expectErrorMatches(throwable -> throwable instanceof StaleConnectionException)
                .verify();
    }
}
