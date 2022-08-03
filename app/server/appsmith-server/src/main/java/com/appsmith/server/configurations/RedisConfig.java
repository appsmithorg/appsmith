package com.appsmith.server.configurations;

import com.appsmith.server.domains.UserSession;
import com.fasterxml.jackson.databind.json.JsonMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.JdkSerializationRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.data.redis.util.ByteUtils;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.session.data.redis.config.annotation.web.server.EnableRedisWebSession;

import java.util.Arrays;

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

    @Bean
    public RedisSerializer<Object> springSessionDefaultRedisSerializer() {
        return new JSONSessionRedisSerializer();
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

    private static class JSONSessionRedisSerializer implements RedisSerializer<Object> {

        private final JdkSerializationRedisSerializer fallback = new JdkSerializationRedisSerializer();

        private final GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(new JsonMapper());

        private static final byte[] SESSION_DATA_PREFIX = "appsmith-session:".getBytes();

        @Override
        public byte[] serialize(Object t) {
            if (t instanceof SecurityContext) {
                final UserSession session = UserSession.fromToken(((SecurityContext) t).getAuthentication());
                final byte[] bytes = jsonSerializer.serialize(session);
                return bytes == null ? null : ByteUtils.concat(SESSION_DATA_PREFIX, bytes);
            }

            return fallback.serialize(t);
        }

        @Override
        public Object deserialize(byte[] bytes) {
            if (ByteUtils.startsWith(bytes, SESSION_DATA_PREFIX)) {
                final byte[] data = Arrays.copyOfRange(bytes, SESSION_DATA_PREFIX.length, bytes.length);
                final UserSession session = jsonSerializer.deserialize(data, UserSession.class);

                if (session == null) {
                    throw new IllegalArgumentException("Could not deserialize user session, got null");
                }

                return new SecurityContextImpl(session.makeToken());
            }

            return fallback.deserialize(bytes);
        }
    }

}
