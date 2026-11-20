package com.appsmith.server.configurations;

import io.lettuce.core.resource.ClientResources;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.ReactiveRedisConnection;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.test.util.ReflectionTestUtils;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.test.StepVerifier;

/**
 * Requests run on Reactor's non-blocking threads, where {@code block()} throws. The shared Redis connection opens
 * lazily, so the first command can arrive on such a thread. When the Redis URL has a password, Lettuce 7.5 calls
 * {@code block()} on the credentials while it opens a connection. With the {@link MDCConfig} hook that production
 * installs on every operator, that call throws, and the first command fails with a 500.
 */
@Testcontainers
class RedisFirstConnectionTest {

    private static final String PASSWORD = "first-connection-test";

    @Container
    private static final GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:6.2.6-alpine"))
            .withCommand("redis-server", "--requirepass", PASSWORD)
            .withExposedPorts(6379);

    private final MDCConfig mdcConfig = new MDCConfig();

    private ClientResources clientResources;

    private LettuceConnectionFactory connectionFactory;

    @BeforeEach
    void setUp() {
        mdcConfig.contextOperatorHook();
        RedisConfig redisConfig = new RedisConfig();
        ReflectionTestUtils.setField(
                redisConfig,
                "redisURL",
                "redis://:" + PASSWORD + "@" + redis.getHost() + ":" + redis.getMappedPort(6379));
        clientResources = redisConfig.clientResources(ObservationRegistry.create(), new SimpleMeterRegistry());
        connectionFactory = (LettuceConnectionFactory) redisConfig.reactiveRedisConnectionFactory(clientResources);
        connectionFactory.afterPropertiesSet();
        connectionFactory.start();
    }

    @AfterEach
    void tearDown() {
        connectionFactory.destroy();
        clientResources.shutdown();
        mdcConfig.cleanupHook();
    }

    @Test
    void should_openTheSharedConnection_when_firstCommandRunsOnNonBlockingThread() {
        // Given
        // The Redis URL has a password, and no command has run yet, so the shared connection is not open.
        ReactiveRedisConnectionFactory reactiveFactory = connectionFactory;

        // When
        Mono<String> reply = Mono.usingWhen(
                        Mono.fromSupplier(reactiveFactory::getReactiveConnection),
                        ReactiveRedisConnection::ping,
                        ReactiveRedisConnection::closeLater)
                .subscribeOn(Schedulers.parallel());

        // Then
        StepVerifier.create(reply).expectNext("PONG").verifyComplete();
    }
}
