package com.appsmith.server.configurations;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Configuration
@Testcontainers
public class RedisTestContainerConfig {

    @Container
    public static GenericContainer redisContainer = new GenericContainer(DockerImageName.parse("redis:6.2.6-alpine"))
            .withExposedPorts(6379);

    @Bean
    @Primary
    public ReactiveRedisConnectionFactory reactiveRedisConnectionFactory() {
        redisContainer.start();
        RedisStandaloneConfiguration redisConf = new RedisStandaloneConfiguration(redisContainer.getHost(),
                redisContainer.getMappedPort(6379));
        return new LettuceConnectionFactory(redisConf);
    }

    @Primary
    @Bean
    ReactiveRedisTemplate<String, Object> reactiveRedisTemplate(ReactiveRedisConnectionFactory factory) {
        RedisSerializer<String> keySerializer = new StringRedisSerializer();
        RedisSerializer<Object> defaultSerializer = new GenericJackson2JsonRedisSerializer();
        RedisSerializationContext<String, Object> serializationContext = RedisSerializationContext
                .<String, Object>newSerializationContext(defaultSerializer).key(keySerializer).hashKey(keySerializer)
                .build();
        return new ReactiveRedisTemplate<>(factory, serializationContext);
    }

    @Primary
    @Bean
    ReactiveRedisOperations<String, String> reactiveRedisOperations(ReactiveRedisConnectionFactory factory) {
        Jackson2JsonRedisSerializer<String> serializer = new Jackson2JsonRedisSerializer<>(String.class);
        RedisSerializationContext.RedisSerializationContextBuilder<String, String> builder =
                RedisSerializationContext.newSerializationContext(new StringRedisSerializer());
        RedisSerializationContext<String, String> context = builder.value(serializer).build();
        return new ReactiveRedisTemplate<>(factory, context);
    }
}