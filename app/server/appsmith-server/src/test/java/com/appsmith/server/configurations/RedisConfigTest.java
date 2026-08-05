package com.appsmith.server.configurations;

import io.lettuce.core.resource.ClientResources;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettucePoolingClientConfiguration;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RedisConfigTest {

    private RedisConfig redisConfig;
    private ClientResources clientResources;

    @BeforeEach
    void setUp() {
        redisConfig = new RedisConfig();
        clientResources = redisConfig.clientResources(ObservationRegistry.create(), new SimpleMeterRegistry());
    }

    @AfterEach
    void tearDown() {
        clientResources.shutdown();
    }

    private LettuceClientConfiguration clientConfigurationFor(String url) {
        ReflectionTestUtils.setField(redisConfig, "redisURL", url);
        LettuceConnectionFactory factory =
                (LettuceConnectionFactory) redisConfig.reactiveRedisConnectionFactory(clientResources);
        return factory.getClientConfiguration();
    }

    @Test
    void redisScheme_factoryUsesProvidedClientResources() {
        LettuceClientConfiguration clientConfiguration = clientConfigurationFor("redis://localhost:6379");
        assertSame(clientResources, clientConfiguration.getClientResources().orElseThrow());
    }

    @Test
    void redissScheme_factoryUsesProvidedClientResourcesAndKeepsSslAndPooling() {
        LettuceClientConfiguration clientConfiguration = clientConfigurationFor("rediss://localhost:6379");
        assertSame(clientResources, clientConfiguration.getClientResources().orElseThrow());
        assertTrue(clientConfiguration.isUseSsl());
        assertInstanceOf(LettucePoolingClientConfiguration.class, clientConfiguration);
    }

    @Test
    void redisClusterScheme_factoryUsesProvidedClientResourcesAndKeepsPooling() {
        LettuceClientConfiguration clientConfiguration = clientConfigurationFor("redis-cluster://localhost:6379");
        assertSame(clientResources, clientConfiguration.getClientResources().orElseThrow());
        assertInstanceOf(LettucePoolingClientConfiguration.class, clientConfiguration);
    }
}
