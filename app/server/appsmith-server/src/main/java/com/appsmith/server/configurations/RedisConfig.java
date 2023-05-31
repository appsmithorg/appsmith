package com.appsmith.server.configurations;

import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.dtos.OAuth2AuthorizedClientDTO;
import com.appsmith.server.dtos.UserSessionDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.session.data.redis.config.annotation.web.server.EnableRedisWebSession;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

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
    ReactiveRedisTemplate<String, Object> reactiveRedisTemplate(ReactiveRedisConnectionFactory factory,
                                                                RedisSerializer<Object> serializer) {
        RedisSerializer<String> keySerializer = new StringRedisSerializer();
        RedisSerializationContext<String, Object> serializationContext = RedisSerializationContext
                .<String, Object>newSerializationContext(serializer).key(keySerializer).hashKey(keySerializer)
                .build();
        return new ReactiveRedisTemplate<>(factory, serializationContext);
    }

    private static class JSONSessionRedisSerializer implements RedisSerializer<Object> {

        private static final byte[] SESSION_DATA_PREFIX = "appsmith-session:".getBytes();

        private static final byte[] OAUTH_CLIENT_PREFIX = "appsmith-oauth-client:".getBytes();

        private final JdkSerializationRedisSerializer fallback = new JdkSerializationRedisSerializer();

        private final GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(new JsonMapper());

        @Override
        public byte[] serialize(Object t) {
            if (t instanceof SecurityContext) {
                final UserSessionDTO session = UserSessionDTO.fromToken(((SecurityContext) t).getAuthentication());
                final byte[] bytes = jsonSerializer.serialize(session);
                return bytes == null ? null : ByteUtils.concat(SESSION_DATA_PREFIX, bytes);

            } else if ((t instanceof Map)) {
                final Map<?, ?> data = (Map<?, ?>) t;
                boolean allValuesAreClientDTOs = true;
                for (final LoginSource loginSource : LoginSource.oauthSources) {
                    final Object value = data.get(loginSource.name().toLowerCase());
                    if (value != null && !(value instanceof OAuth2AuthorizedClientDTO)) {
                        allValuesAreClientDTOs = false;
                        break;
                    }
                }
                if (allValuesAreClientDTOs) {
                    final byte[] bytes = serializeOAuthClientMap(data);
                    return bytes == null ? null : ByteUtils.concat(OAUTH_CLIENT_PREFIX, bytes);
                }

            }

            return fallback.serialize(t);
        }

        private byte[] serializeOAuthClientMap(Map<?, ?> data) {
            final Map<String, Object> dataMap = new HashMap<>();
            for (final Map.Entry<?, ?> entry : data.entrySet()) {
                if (entry.getValue() instanceof OAuth2AuthorizedClient) {
                    final String key = (String) entry.getKey();
                    final OAuth2AuthorizedClient client = (OAuth2AuthorizedClient) entry.getValue();
                    final OAuth2AuthorizedClientDTO dto;
                    try {
                        dto = OAuth2AuthorizedClientDTO.fromOAuth2AuthorizedClient(client);
                    } catch (Exception e) {
                        e.printStackTrace();
                        throw e;
                    }
                    dataMap.put(key, dto);
                } else {
                    log.warn("Unknown data type found in session data. Key: {}, Value: {}", entry.getKey(), entry.getValue());
                }
            }
            return jsonSerializer.serialize(dataMap);
        }

        @Override
        public Object deserialize(byte[] bytes) {
            if (ByteUtils.startsWith(bytes, SESSION_DATA_PREFIX)) {
                final byte[] data = Arrays.copyOfRange(bytes, SESSION_DATA_PREFIX.length, bytes.length);
                final UserSessionDTO session = jsonSerializer.deserialize(data, UserSessionDTO.class);

                if (session == null) {
                    throw new IllegalArgumentException("Could not deserialize user session, got null");
                }

                return new SecurityContextImpl(session.makeToken());

            } else if (ByteUtils.startsWith(bytes, OAUTH_CLIENT_PREFIX)) {
                final byte[] data = Arrays.copyOfRange(bytes, OAUTH_CLIENT_PREFIX.length, bytes.length);

                final HashMap<String, Map<?, ?>> clientData = jsonSerializer.deserialize(data, HashMap.class);
                if (clientData == null) {
                    throw new IllegalArgumentException("Could not deserialize OAuth2 client, got null");
                }

                final Map<String, OAuth2AuthorizedClient> sessionData = new HashMap<>();
                for (final Map.Entry<String, Map<?, ?>> entry : clientData.entrySet()) {
                    final OAuth2AuthorizedClientDTO dto = new ObjectMapper()
                            .convertValue(entry.getValue(), OAuth2AuthorizedClientDTO.class);
                    sessionData.put(entry.getKey(), dto.makeOAuth2AuthorizedClient());
                }

                return sessionData;

            }

            return fallback.deserialize(bytes);
        }
    }

}
