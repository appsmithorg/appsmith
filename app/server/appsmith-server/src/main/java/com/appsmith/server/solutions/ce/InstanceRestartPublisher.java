package com.appsmith.server.solutions.ce;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

/**
 * Publishes a restart to every pod of this Appsmith instance. Emits the number of subscribers that received the
 * message once Redis has accepted it. Does not wait for pods to restart, and does not restart the local pod itself.
 */
@Component
@Slf4j
public class InstanceRestartPublisher {

    private final ConfigService configService;
    private final ReactiveRedisTemplate<String, String> redis;

    public InstanceRestartPublisher(ConfigService configService, ReactiveRedisConnectionFactory connectionFactory) {
        this.configService = configService;
        // String serializers on both sides. The shared ReactiveRedisOperations bean JSON-encodes values, which
        // the subscriber's string decoder would not read back as the raw payload.
        this.redis = new ReactiveRedisTemplate<>(connectionFactory, RedisSerializationContext.string());
    }

    public Mono<Long> publish() {
        return configService
                .getInstanceId()
                .filter(StringUtils::hasText)
                .switchIfEmpty(Mono.defer(() -> {
                    log.error("Instance id unavailable; refusing to publish an unscoped restart");
                    return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                }))
                .flatMap(this::publishTo);
    }

    private Mono<Long> publishTo(String instanceId) {
        String channel = InstanceRestartChannel.forInstance(instanceId);
        log.warn("Publishing instance restart on channel {}", channel);
        return redis.convertAndSend(channel, InstanceRestartChannel.PAYLOAD)
                .doOnNext(receivers ->
                        log.warn("Published instance restart on channel {} to {} subscriber(s)", channel, receivers))
                .onErrorMap(error -> {
                    log.error("Failed to publish instance restart on channel {}", channel, error);
                    return new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR);
                });
    }
}
