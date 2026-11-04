package com.appsmith.server.services.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.services.ConfigService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Tells every pod of this Appsmith instance to drop its cached connection for a datasource storage, so a credential
 * change takes effect everywhere instead of only on the pod that served the save.
 */
@Component
@Slf4j
public class DatasourceContextInvalidationPublisher {

    /**
     * Bounds the time a save can spend on the broadcast when Redis is unhealthy. Lettuce's own command timeout is
     * much longer than a user should wait for a datasource save.
     */
    static final Duration PUBLISH_TIMEOUT = Duration.ofSeconds(2);

    private final ConfigService configService;
    private final ReactiveRedisTemplate<String, String> redis;
    private final ObjectMapper objectMapper;

    public DatasourceContextInvalidationPublisher(
            ConfigService configService, ReactiveRedisConnectionFactory connectionFactory, ObjectMapper objectMapper) {
        this.configService = configService;
        // String serializers on both sides. The shared ReactiveRedisOperations bean JSON-encodes values, which
        // the subscriber's string decoder would not read back as the raw payload.
        this.redis = new ReactiveRedisTemplate<>(connectionFactory, RedisSerializationContext.string());
        this.objectMapper = objectMapper;
    }

    /**
     * Emits the number of subscribers that received the message once Redis has accepted it. Completes empty when
     * nothing was published: an id is missing, the instance id is unavailable, or Redis failed. Never errors, so a
     * failed broadcast does not fail the save that triggered it; each pod still rebuilds the connection lazily
     * through the staleness check on its next use.
     */
    public Mono<Long> publish(DatasourceStorage datasourceStorage) {
        DatasourceContextInvalidationMessage message = DatasourceContextInvalidationMessage.from(datasourceStorage);
        if (!message.hasAllIds()) {
            log.debug(
                    "Not broadcasting datasource context invalidation for datasource {}: datasource id, environment id or plugin id missing",
                    message.datasourceId());
            return Mono.empty();
        }
        return configService
                .getInstanceId()
                .filter(StringUtils::hasText)
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn(
                            "Instance id unavailable; datasource context invalidation for datasource {} not broadcast",
                            message.datasourceId());
                    return Mono.empty();
                }))
                .flatMap(instanceId -> publishTo(DatasourceContextInvalidationChannel.forInstance(instanceId), message))
                .onErrorResume(error -> {
                    log.error(
                            "Failed to broadcast datasource context invalidation for datasource {}, environment {}",
                            message.datasourceId(),
                            message.environmentId(),
                            error);
                    return Mono.empty();
                });
    }

    private Mono<Long> publishTo(String channel, DatasourceContextInvalidationMessage message) {
        final String payload;
        try {
            payload = objectMapper.writeValueAsString(message);
        } catch (JsonProcessingException e) {
            return Mono.error(e);
        }
        return redis.convertAndSend(channel, payload)
                .timeout(PUBLISH_TIMEOUT)
                .doOnNext(receivers -> log.info(
                        "Broadcast datasource context invalidation for datasource {}, environment {} to {} subscriber(s)",
                        message.datasourceId(),
                        message.environmentId(),
                        receivers));
    }
}
