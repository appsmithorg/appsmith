package com.appsmith.server.solutions.ce;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.solutions.EnvManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@Testcontainers
class InstanceRestartBroadcastTest {

    private static final String INSTANCE_A = "instance-a";
    private static final String INSTANCE_B = "instance-b";

    @Container
    static final GenericContainer<?> REDIS =
            new GenericContainer<>(DockerImageName.parse("redis:6.2.6-alpine")).withExposedPorts(6379);

    private LettuceConnectionFactory connectionFactory;
    private ConfigService configService;
    private EnvManager envManager;
    private InstanceRestartPublisher publisher;
    private InstanceRestartSubscriber subscriber;
    private AtomicInteger localRestarts;

    @BeforeEach
    void setup() {
        connectionFactory = new LettuceConnectionFactory(REDIS.getHost(), REDIS.getMappedPort(6379));
        connectionFactory.afterPropertiesSet();
        configService = mock(ConfigService.class);
        envManager = mock(EnvManager.class);
        localRestarts = new AtomicInteger();
        when(envManager.restartWithoutAclCheck()).thenAnswer(invocation -> {
            localRestarts.incrementAndGet();
            return Mono.empty();
        });
        when(configService.getInstanceId()).thenReturn(Mono.just(INSTANCE_A));
        publisher = new InstanceRestartPublisher(configService, connectionFactory);
        subscriber = new InstanceRestartSubscriber(connectionFactory, configService, envManager);
    }

    @AfterEach
    void tearDown() {
        subscriber.shutdown();
        connectionFactory.destroy();
    }

    @Test
    void publish_isReceivedBySubscriberOnTheSameInstance() {
        subscriber.subscribeToInstanceRestart();

        await().atMost(Duration.ofSeconds(10))
                .pollInterval(Duration.ofMillis(50))
                .until(() -> {
                    StepVerifier.create(publisher.publish()).expectNextCount(1).verifyComplete();
                    return localRestarts.get() >= 1;
                });
    }

    @Test
    void publish_completesWithoutWaitingForTheLocalRestart() {
        when(envManager.restartWithoutAclCheck()).thenAnswer(invocation -> {
            localRestarts.incrementAndGet();
            return Mono.never();
        });
        subscriber.subscribeToInstanceRestart();

        await().atMost(Duration.ofSeconds(10))
                .pollInterval(Duration.ofMillis(50))
                .until(() -> {
                    StepVerifier.create(publisher.publish())
                            .expectNextCount(1)
                            .expectComplete()
                            .verify(Duration.ofSeconds(2));
                    return localRestarts.get() >= 1;
                });
    }

    @Test
    void publish_doesNotRestartADifferentInstance() {
        subscriber.subscribeToInstanceRestart();
        int received = warmup();

        when(configService.getInstanceId()).thenReturn(Mono.just(INSTANCE_B));
        StepVerifier.create(publisher.publish()).expectNextCount(1).verifyComplete();

        await().during(Duration.ofMillis(500))
                .atMost(Duration.ofSeconds(2))
                .until(() -> localRestarts.get() == received);
    }

    @Test
    void subscriber_keepsListeningAfterALocalRestartFailure() {
        when(envManager.restartWithoutAclCheck()).thenAnswer(invocation -> {
            int attempt = localRestarts.incrementAndGet();
            if (attempt == 1) {
                return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
            }
            return Mono.empty();
        });
        subscriber.subscribeToInstanceRestart();

        await().atMost(Duration.ofSeconds(10))
                .pollInterval(Duration.ofMillis(50))
                .until(() -> {
                    StepVerifier.create(publisher.publish()).expectNextCount(1).verifyComplete();
                    return localRestarts.get() >= 2;
                });
    }

    @Test
    void subscriber_treatsAnyPayloadAsARestart() {
        subscriber.subscribeToInstanceRestart();
        int received = warmup();

        ReactiveRedisTemplate<String, String> redis =
                new ReactiveRedisTemplate<>(connectionFactory, RedisSerializationContext.string());
        StepVerifier.create(redis.convertAndSend(InstanceRestartChannel.forInstance(INSTANCE_A), "request-id-later"))
                .expectNextMatches(receivers -> receivers >= 1)
                .verifyComplete();

        await().atMost(Duration.ofSeconds(5)).until(() -> localRestarts.get() == received + 1);
    }

    @Test
    void subscriber_subscribesOnce() {
        subscriber.subscribeToInstanceRestart();
        subscriber.subscribeToInstanceRestart();
        int received = warmup();

        StepVerifier.create(publisher.publish()).expectNextCount(1).verifyComplete();

        await().during(Duration.ofMillis(500))
                .atMost(Duration.ofSeconds(2))
                .until(() -> localRestarts.get() == received + 1);
    }

    @Test
    void subscriber_withoutInstanceId_doesNotRestart() {
        when(configService.getInstanceId()).thenReturn(Mono.empty());
        subscriber.subscribeToInstanceRestart();
        // Let the missing-id path finish. A subscriber that wrongly joined the channel would be listening by now.
        await().pollDelay(Duration.ofMillis(500)).atMost(Duration.ofSeconds(2)).until(() -> true);

        ReactiveRedisTemplate<String, String> redis =
                new ReactiveRedisTemplate<>(connectionFactory, RedisSerializationContext.string());
        StepVerifier.create(redis.convertAndSend(
                        InstanceRestartChannel.forInstance(INSTANCE_A), InstanceRestartChannel.PAYLOAD))
                .expectNextCount(1)
                .verifyComplete();

        await().during(Duration.ofMillis(500)).atMost(Duration.ofSeconds(2)).until(() -> localRestarts.get() == 0);
        assertThat(localRestarts.get()).isZero();
    }

    /**
     * Publishes until this subscriber has restarted once, then waits for in-flight publishes from that loop to finish.
     */
    private int warmup() {
        await().atMost(Duration.ofSeconds(10))
                .pollInterval(Duration.ofMillis(50))
                .until(() -> {
                    StepVerifier.create(publisher.publish()).expectNextCount(1).verifyComplete();
                    return localRestarts.get() >= 1;
                });
        await().pollDelay(Duration.ofMillis(400)).atMost(Duration.ofSeconds(2)).until(() -> true);
        return localRestarts.get();
    }
}
