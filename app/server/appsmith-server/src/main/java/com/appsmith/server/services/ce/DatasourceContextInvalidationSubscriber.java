package com.appsmith.server.services.ce;

import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceContextService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.ReactiveRedisMessageListenerContainer;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import reactor.core.Disposable;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.util.retry.Retry;

import java.time.Duration;

/**
 * Receives datasource context invalidation broadcasts and drops the matching cached connection on this pod. The pod
 * that published the message receives its own broadcast too, so it does not need to evict locally before publishing.
 */
@Component
@Slf4j
public class DatasourceContextInvalidationSubscriber {

    private final ReactiveRedisConnectionFactory connectionFactory;
    private final ConfigService configService;
    private final DatasourceContextService datasourceContextService;
    private final ObjectMapper objectMapper;

    private volatile ReactiveRedisMessageListenerContainer container;
    private volatile Disposable subscription;

    public DatasourceContextInvalidationSubscriber(
            ReactiveRedisConnectionFactory connectionFactory,
            ConfigService configService,
            DatasourceContextService datasourceContextService,
            ObjectMapper objectMapper) {
        this.connectionFactory = connectionFactory;
        this.configService = configService;
        this.datasourceContextService = datasourceContextService;
        this.objectMapper = objectMapper;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void subscribeToDatasourceContextInvalidation() {
        if (subscription != null) {
            return;
        }
        container = new ReactiveRedisMessageListenerContainer(connectionFactory);
        subscription = configService
                .getInstanceId()
                .filter(StringUtils::hasText)
                .switchIfEmpty(Mono.defer(() -> {
                    log.error(
                            "Instance id unavailable; datasource context invalidation broadcasts will not be received");
                    return Mono.empty();
                }))
                .flatMapMany(instanceId -> {
                    String channel = DatasourceContextInvalidationChannel.forInstance(instanceId);
                    log.info("Subscribing to datasource context invalidation channel {}", channel);
                    return container
                            .receive(ChannelTopic.of(channel))
                            // handleMessage looks up the plugin and drops the connection. Redis delivers messages on
                            // its own event loop, so hop off it first.
                            .publishOn(Schedulers.boundedElastic())
                            .flatMap(message -> {
                                log.debug("Received datasource context invalidation on channel {}", channel);
                                return handleMessage(message.getMessage());
                            });
                })
                .retryWhen(Retry.backoff(Long.MAX_VALUE, Duration.ofSeconds(1)).maxBackoff(Duration.ofSeconds(30)))
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        ignored -> {}, error -> log.error("Datasource context invalidation subscription ended", error));
    }

    /**
     * Drops the cached datasource context named by one message. Always completes: a malformed message or a failed
     * eviction is logged and skipped so the subscription keeps serving later messages.
     */
    Mono<Void> handleMessage(String payload) {
        final DatasourceContextInvalidationMessage message;
        try {
            message = objectMapper.readValue(payload, DatasourceContextInvalidationMessage.class);
        } catch (JsonProcessingException e) {
            log.warn("Ignoring malformed datasource context invalidation message", e);
            return Mono.empty();
        }
        if (!message.hasAllIds()) {
            log.warn(
                    "Ignoring datasource context invalidation message for datasource {}: datasource id, environment id or plugin id missing",
                    message.datasourceId());
            return Mono.empty();
        }
        return datasourceContextService
                .deleteDatasourceContext(message.toDatasourceStorage())
                .doOnNext(ignored -> log.info(
                        "Dropped cached datasource context for datasource {}, environment {} after an invalidation broadcast",
                        message.datasourceId(),
                        message.environmentId()))
                .onErrorResume(error -> {
                    log.error(
                            "Failed to drop cached datasource context for datasource {}, environment {} after an invalidation broadcast",
                            message.datasourceId(),
                            message.environmentId(),
                            error);
                    return Mono.empty();
                })
                .then();
    }

    @PreDestroy
    public void shutdown() {
        Disposable current = subscription;
        if (current != null) {
            current.dispose();
        }
        ReactiveRedisMessageListenerContainer currentContainer = container;
        if (currentContainer != null) {
            currentContainer.destroy();
        }
    }
}
