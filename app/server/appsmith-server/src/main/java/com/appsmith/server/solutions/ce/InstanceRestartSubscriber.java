package com.appsmith.server.solutions.ce;

import com.appsmith.server.services.ConfigService;
import com.appsmith.server.solutions.EnvManager;
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
 * Receives instance restart broadcasts and runs the local supervisor restart. The pod that published the message
 * restarts here too, when it receives its own broadcast, so {@code restart()} does not restart the local pod itself.
 */
@Component
@Slf4j
public class InstanceRestartSubscriber {

    private final ReactiveRedisConnectionFactory connectionFactory;
    private final ConfigService configService;
    private final EnvManager envManager;

    private volatile ReactiveRedisMessageListenerContainer container;
    private volatile Disposable subscription;

    public InstanceRestartSubscriber(
            ReactiveRedisConnectionFactory connectionFactory, ConfigService configService, EnvManager envManager) {
        this.connectionFactory = connectionFactory;
        this.configService = configService;
        this.envManager = envManager;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void subscribeToInstanceRestart() {
        if (subscription != null) {
            return;
        }
        container = new ReactiveRedisMessageListenerContainer(connectionFactory);
        subscription = configService
                .getInstanceId()
                .filter(StringUtils::hasText)
                .switchIfEmpty(Mono.defer(() -> {
                    log.error("Instance id unavailable; instance restart broadcasts will not be received");
                    return Mono.empty();
                }))
                .flatMapMany(instanceId -> {
                    String channel = InstanceRestartChannel.forInstance(instanceId);
                    log.warn("Subscribing to instance restart channel {}", channel);
                    return container
                            .receive(ChannelTopic.of(channel))
                            // restartWithoutAclCheck runs supervisorctl on the calling thread. Redis delivers
                            // messages on its own event loop, so hop off it before that blocking exec.
                            .publishOn(Schedulers.boundedElastic())
                            .flatMap(message -> {
                                // Payload is a placeholder today. A request id can be read from it later.
                                log.warn(
                                        "Received instance restart broadcast on channel {}: {}",
                                        channel,
                                        message.getMessage());
                                return envManager.restartWithoutAclCheck().onErrorResume(error -> {
                                    log.error("Local restart after broadcast failed on channel {}", channel, error);
                                    return Mono.empty();
                                });
                            });
                })
                .retryWhen(Retry.backoff(Long.MAX_VALUE, Duration.ofSeconds(1)).maxBackoff(Duration.ofSeconds(30)))
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(ignored -> {}, error -> log.error("Instance restart subscription ended", error));
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
