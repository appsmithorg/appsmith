package com.appsmith.server.services.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceContextService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@Testcontainers
class DatasourceContextInvalidationBroadcastTest {

    private static final String INSTANCE_A = "instance-a";
    private static final String INSTANCE_B = "instance-b";

    @Container
    static final GenericContainer<?> REDIS =
            new GenericContainer<>(DockerImageName.parse("redis:6.2.6-alpine")).withExposedPorts(6379);

    private LettuceConnectionFactory connectionFactory;
    private ConfigService configService;
    private DatasourceContextService datasourceContextService;
    private DatasourceContextInvalidationPublisher publisher;
    private DatasourceContextInvalidationSubscriber subscriber;
    private List<DatasourceStorage> deleted;

    @BeforeEach
    void setup() {
        connectionFactory = new LettuceConnectionFactory(REDIS.getHost(), REDIS.getMappedPort(6379));
        connectionFactory.afterPropertiesSet();
        configService = mock(ConfigService.class);
        datasourceContextService = mock(DatasourceContextService.class);
        deleted = new CopyOnWriteArrayList<>();
        when(datasourceContextService.deleteDatasourceContext(any())).thenAnswer(invocation -> {
            deleted.add(invocation.getArgument(0));
            return Mono.empty();
        });
        when(configService.getInstanceId()).thenReturn(Mono.just(INSTANCE_A));
        ObjectMapper objectMapper = new ObjectMapper();
        publisher = new DatasourceContextInvalidationPublisher(configService, connectionFactory, objectMapper);
        subscriber = new DatasourceContextInvalidationSubscriber(
                connectionFactory, configService, datasourceContextService, objectMapper);
    }

    @AfterEach
    void tearDown() {
        subscriber.shutdown();
        connectionFactory.destroy();
    }

    @Test
    void should_deleteContextOnSubscribingPod_when_publishedOnSameInstance() {
        // Given
        subscriber.subscribeToDatasourceContextInvalidation();
        DatasourceStorage datasourceStorage = storage("ds-1", "env-1", "plugin-1");

        // When
        await().atMost(Duration.ofSeconds(10))
                .pollInterval(Duration.ofMillis(50))
                .until(() -> {
                    StepVerifier.create(publisher.publish(datasourceStorage))
                            .expectNextCount(1)
                            .verifyComplete();
                    return !deleted.isEmpty();
                });

        // Then
        DatasourceStorage received = deleted.get(0);
        assertThat(received.getDatasourceId()).isEqualTo("ds-1");
        assertThat(received.getEnvironmentId()).isEqualTo("env-1");
        assertThat(received.getPluginId()).isEqualTo("plugin-1");
    }

    @Test
    void should_ignoreInvalidation_when_publishedForAnotherInstance() {
        // Given
        subscriber.subscribeToDatasourceContextInvalidation();
        int received = warmup();
        when(configService.getInstanceId()).thenReturn(Mono.just(INSTANCE_B));

        // When
        StepVerifier.create(publisher.publish(storage("ds-2", "env-1", "plugin-1")))
                .expectNextCount(1)
                .verifyComplete();

        // Then
        await().during(Duration.ofMillis(500)).atMost(Duration.ofSeconds(2)).until(() -> deleted.size() == received);
    }

    /**
     * Publishes until this subscriber has received once, then waits for in-flight publishes from that loop to finish.
     */
    private int warmup() {
        await().atMost(Duration.ofSeconds(10))
                .pollInterval(Duration.ofMillis(50))
                .until(() -> {
                    StepVerifier.create(publisher.publish(storage("warmup", "env-1", "plugin-1")))
                            .expectNextCount(1)
                            .verifyComplete();
                    return !deleted.isEmpty();
                });
        await().pollDelay(Duration.ofMillis(400)).atMost(Duration.ofSeconds(2)).until(() -> true);
        return deleted.size();
    }

    private static DatasourceStorage storage(String datasourceId, String environmentId, String pluginId) {
        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setDatasourceId(datasourceId);
        datasourceStorage.setEnvironmentId(environmentId);
        datasourceStorage.setPluginId(pluginId);
        return datasourceStorage;
    }
}
