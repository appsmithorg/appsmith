package com.appsmith.server.configurations;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.JdkSerializationRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.session.data.redis.config.annotation.web.server.EnableRedisWebSession;

@Configuration
@Slf4j
// Setting the maxInactiveInterval to 30 days
@EnableRedisWebSession(maxInactiveIntervalInSeconds = 2592000)
public class RedisConfig {

    /**
     * This is the topic to which we will publish & subscribe to. We can have multiple topics based on the messages
     * that we wish to broadcast. Starting with a single one for now.
     *
     * @return
     */
    @Bean
    ChannelTopic topic() {
        return new ChannelTopic("appsmith:queue");
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

    // Lifted from below and turned it into a bean. Wish Spring provided it as a bean.
    // RedisWebSessionConfiguration.createReactiveRedisTemplate
    @Bean
    ReactiveRedisTemplate<String, Object> reactiveRedisTemplate(ReactiveRedisConnectionFactory factory) {
        RedisSerializer<String> keySerializer = new StringRedisSerializer();
        RedisSerializer<Object> defaultSerializer = new JdkSerializationRedisSerializer(getClass().getClassLoader());
        RedisSerializationContext<String, Object> serializationContext = RedisSerializationContext
                .<String, Object>newSerializationContext(defaultSerializer).key(keySerializer).hashKey(keySerializer)
                .build();
        return new ReactiveRedisTemplate<>(factory, serializationContext);
    }

}
