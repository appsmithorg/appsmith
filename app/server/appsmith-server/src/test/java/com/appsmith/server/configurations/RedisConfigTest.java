package com.appsmith.server.configurations;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.connection.RedisClusterConfiguration;
import org.springframework.data.redis.connection.RedisSentinelConfiguration;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class RedisConfigTest {

    private RedisConfig redisConfig;

    @BeforeEach
    void setUp() {
        redisConfig = new RedisConfig();
    }

    @Test
    void testReactiveRedisConnectionFactory_WithStandaloneRedis_CreatesStandaloneConfiguration() {
        // Given
        String redisUrl = "redis://localhost:6379";
        ReflectionTestUtils.setField(redisConfig, "redisURL", redisUrl);

        // When
        ReactiveRedisConnectionFactory factory = redisConfig.reactiveRedisConnectionFactory();

        // Then
        assertNotNull(factory);
        assertInstanceOf(LettuceConnectionFactory.class, factory);
        LettuceConnectionFactory lettuceFactory = (LettuceConnectionFactory) factory;
        assertInstanceOf(RedisStandaloneConfiguration.class, lettuceFactory.getStandaloneConfiguration());

        RedisStandaloneConfiguration config = lettuceFactory.getStandaloneConfiguration();
        assertEquals("localhost", config.getHostName());
        assertEquals(6379, config.getPort());
    }

    @Test
    void testReactiveRedisConnectionFactory_WithStandaloneRedisAndAuth_CreatesConfigurationWithAuth() {
        // Given
        String redisUrl = "redis://username:password@localhost:6379";
        ReflectionTestUtils.setField(redisConfig, "redisURL", redisUrl);

        // When
        ReactiveRedisConnectionFactory factory = redisConfig.reactiveRedisConnectionFactory();

        // Then
        assertNotNull(factory);
        assertInstanceOf(LettuceConnectionFactory.class, factory);
        LettuceConnectionFactory lettuceFactory = (LettuceConnectionFactory) factory;

        RedisStandaloneConfiguration config = lettuceFactory.getStandaloneConfiguration();
        assertEquals("localhost", config.getHostName());
        assertEquals(6379, config.getPort());
        assertEquals("username", config.getUsername());
        assertTrue(config.getPassword().isPresent());
        assertArrayEquals("password".toCharArray(), config.getPassword().get());
    }

    @Test
    void testReactiveRedisConnectionFactory_WithStandaloneSslRedis_CreatesStandaloneConfigurationWithSsl() {
        // Given
        String redisUrl = "rediss://localhost:6380";
        ReflectionTestUtils.setField(redisConfig, "redisURL", redisUrl);

        // When
        ReactiveRedisConnectionFactory factory = redisConfig.reactiveRedisConnectionFactory();

        // Then
        assertNotNull(factory);
        assertInstanceOf(LettuceConnectionFactory.class, factory);
        LettuceConnectionFactory lettuceFactory = (LettuceConnectionFactory) factory;
        assertInstanceOf(RedisStandaloneConfiguration.class, lettuceFactory.getStandaloneConfiguration());

        RedisStandaloneConfiguration config = lettuceFactory.getStandaloneConfiguration();
        assertEquals("localhost", config.getHostName());
        assertEquals(6380, config.getPort());

        // Verify SSL is configured
        assertTrue(lettuceFactory.isUseSsl());
    }

    @Test
    void testReactiveRedisConnectionFactory_WithStandaloneSslRedisAndAuth_CreatesConfigurationWithAuthAndSsl() {
        // Given
        String redisUrl = "rediss://username:password@localhost:6380";
        ReflectionTestUtils.setField(redisConfig, "redisURL", redisUrl);

        // When
        ReactiveRedisConnectionFactory factory = redisConfig.reactiveRedisConnectionFactory();

        // Then
        assertNotNull(factory);
        assertInstanceOf(LettuceConnectionFactory.class, factory);
        LettuceConnectionFactory lettuceFactory = (LettuceConnectionFactory) factory;

        RedisStandaloneConfiguration config = lettuceFactory.getStandaloneConfiguration();
        assertEquals("localhost", config.getHostName());
        assertEquals(6380, config.getPort());
        assertEquals("username", config.getUsername());
        assertTrue(config.getPassword().isPresent());
        assertArrayEquals("password".toCharArray(), config.getPassword().get());
        assertTrue(lettuceFactory.isUseSsl());
    }

    @Test
    void testReactiveRedisConnectionFactory_WithSentinelRedis_CreatesSentinelConfiguration() {
        // Given
        String redisUrl = "redis-sentinel://sentinel-host:26379";
        String sentinelMaster = "mymaster";
        ReflectionTestUtils.setField(redisConfig, "redisURL", redisUrl);
        ReflectionTestUtils.setField(redisConfig, "redisSentinelMaster", sentinelMaster);

        // When
        ReactiveRedisConnectionFactory factory = redisConfig.reactiveRedisConnectionFactory();

        // Then
        assertNotNull(factory);
        assertInstanceOf(LettuceConnectionFactory.class, factory);
        LettuceConnectionFactory lettuceFactory = (LettuceConnectionFactory) factory;
        assertInstanceOf(RedisSentinelConfiguration.class, lettuceFactory.getSentinelConfiguration());

        RedisSentinelConfiguration config = lettuceFactory.getSentinelConfiguration();
        assertNotNull(config.getMaster());
        assertEquals(sentinelMaster, config.getMaster().getName());
        assertNotNull(config.getSentinels());
        assertEquals(1, config.getSentinels().size());
    }

    @Test
    void testReactiveRedisConnectionFactory_WithSentinelRedisAndAuth_CreatesSentinelConfigurationWithAuth() {
        // Given
        String redisUrl = "redis-sentinel://username:password@sentinel-host:26379";
        String sentinelMaster = "mymaster";
        ReflectionTestUtils.setField(redisConfig, "redisURL", redisUrl);
        ReflectionTestUtils.setField(redisConfig, "redisSentinelMaster", sentinelMaster);

        // When
        ReactiveRedisConnectionFactory factory = redisConfig.reactiveRedisConnectionFactory();

        // Then
        assertNotNull(factory);
        assertInstanceOf(LettuceConnectionFactory.class, factory);
        LettuceConnectionFactory lettuceFactory = (LettuceConnectionFactory) factory;

        RedisSentinelConfiguration config = lettuceFactory.getSentinelConfiguration();
        assertNotNull(config);
        assertNotNull(config.getMaster());
        assertEquals(sentinelMaster, config.getMaster().getName());
        assertEquals("username", config.getUsername());
        assertTrue(config.getPassword().isPresent());
        assertArrayEquals("password".toCharArray(), config.getPassword().get());
    }

    @Test
    void testReactiveRedisConnectionFactory_WithSentinelRedisWithNullMaster_ThrowsException() {
        // Given
        String redisUrl = "redis-sentinel://sentinel-host:26379";
        ReflectionTestUtils.setField(redisConfig, "redisURL", redisUrl);
        ReflectionTestUtils.setField(redisConfig, "redisSentinelMaster", null);

        // When & Then
        Exception exception =
                assertThrows(IllegalStateException.class, () -> redisConfig.reactiveRedisConnectionFactory());
        assertTrue(exception.getMessage().contains("Redis Sentinel Master is not configured"));
    }

    @Test
    void testReactiveRedisConnectionFactory_WithSentinelRedisWithEmptyMaster_ThrowsException() {
        // Given - empty string is the production default from @Value("${appsmith.redis.sentinel.master:}")
        String redisUrl = "redis-sentinel://sentinel-host:26379";
        ReflectionTestUtils.setField(redisConfig, "redisURL", redisUrl);
        ReflectionTestUtils.setField(redisConfig, "redisSentinelMaster", "");

        // When & Then
        Exception exception =
                assertThrows(IllegalStateException.class, () -> redisConfig.reactiveRedisConnectionFactory());
        assertTrue(exception.getMessage().contains("Redis Sentinel Master is not configured"));
    }

    @Test
    void testReactiveRedisConnectionFactory_WithClusterRedis_CreatesClusterConfiguration() {
        // Given
        String redisUrl = "redis-cluster://cluster-host:6379";
        ReflectionTestUtils.setField(redisConfig, "redisURL", redisUrl);

        // When
        ReactiveRedisConnectionFactory factory = redisConfig.reactiveRedisConnectionFactory();

        // Then
        assertNotNull(factory);
        assertInstanceOf(LettuceConnectionFactory.class, factory);
        LettuceConnectionFactory lettuceFactory = (LettuceConnectionFactory) factory;
        assertInstanceOf(RedisClusterConfiguration.class, lettuceFactory.getClusterConfiguration());

        RedisClusterConfiguration config = lettuceFactory.getClusterConfiguration();
        assertNotNull(config.getClusterNodes());
        assertEquals(1, config.getClusterNodes().size());
    }

    @Test
    void testReactiveRedisConnectionFactory_WithClusterRedisAndAuth_CreatesClusterConfigurationWithAuth() {
        // Given
        String redisUrl = "redis-cluster://username:password@cluster-host:6379";
        ReflectionTestUtils.setField(redisConfig, "redisURL", redisUrl);

        // When
        ReactiveRedisConnectionFactory factory = redisConfig.reactiveRedisConnectionFactory();

        // Then
        assertNotNull(factory);
        assertInstanceOf(LettuceConnectionFactory.class, factory);
        LettuceConnectionFactory lettuceFactory = (LettuceConnectionFactory) factory;

        RedisClusterConfiguration config = lettuceFactory.getClusterConfiguration();
        assertNotNull(config);
        assertEquals("username", config.getUsername());
        assertTrue(config.getPassword().isPresent());
        assertArrayEquals("password".toCharArray(), config.getPassword().get());
    }

    @Test
    void testReactiveRedisConnectionFactory_WithInvalidScheme_ThrowsException() {
        // Given
        String redisUrl = "invalid-scheme://localhost:6379";
        ReflectionTestUtils.setField(redisConfig, "redisURL", redisUrl);

        // When & Then
        Exception exception = assertThrows(RuntimeException.class, () -> redisConfig.reactiveRedisConnectionFactory());

        assertTrue(exception.getMessage().contains("Invalid redis scheme"));
    }

    @Test
    void testReactiveRedisConnectionFactory_WithPasswordOnlyAuth_CreatesConfigurationWithAuth() {
        // Given
        String redisUrl = "redis://:password@localhost:6379";
        ReflectionTestUtils.setField(redisConfig, "redisURL", redisUrl);

        // When
        ReactiveRedisConnectionFactory factory = redisConfig.reactiveRedisConnectionFactory();

        // Then
        assertNotNull(factory);
        assertInstanceOf(LettuceConnectionFactory.class, factory);
        LettuceConnectionFactory lettuceFactory = (LettuceConnectionFactory) factory;

        RedisStandaloneConfiguration config = lettuceFactory.getStandaloneConfiguration();
        assertEquals("", config.getUsername());
        assertTrue(config.getPassword().isPresent());
        assertArrayEquals("password".toCharArray(), config.getPassword().get());
    }

    @Test
    void testReactiveRedisConnectionFactory_WithCustomPort_CreatesConfigurationWithCustomPort() {
        // Given
        String redisUrl = "redis://localhost:9999";
        ReflectionTestUtils.setField(redisConfig, "redisURL", redisUrl);

        // When
        ReactiveRedisConnectionFactory factory = redisConfig.reactiveRedisConnectionFactory();

        // Then
        assertNotNull(factory);
        assertInstanceOf(LettuceConnectionFactory.class, factory);
        LettuceConnectionFactory lettuceFactory = (LettuceConnectionFactory) factory;

        RedisStandaloneConfiguration config = lettuceFactory.getStandaloneConfiguration();
        assertEquals("localhost", config.getHostName());
        assertEquals(9999, config.getPort());
    }

    @Test
    void testReactiveRedisConnectionFactory_DoesNotThrowException_WhenCalledMultipleTimes() {
        // Given
        String redisUrl = "redis://localhost:6379";
        ReflectionTestUtils.setField(redisConfig, "redisURL", redisUrl);

        // When & Then
        assertDoesNotThrow(() -> {
            redisConfig.reactiveRedisConnectionFactory();
            redisConfig.reactiveRedisConnectionFactory();
        });
    }
}
