package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.diagnostics.DiagnosticsValues;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.data.mongo.MongoReactiveHealthIndicator;
import org.springframework.boot.actuate.data.redis.RedisReactiveHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.ReactiveHealthIndicator;
import org.springframework.boot.actuate.health.Status;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.concurrent.TimeoutException;

/**
 * Reports the status of MongoDB and Redis as {@code UP}, {@code DOWN} or {@code UNKNOWN}. It reads only the status
 * code of each health check, never its details.
 */
@Component
public class DiagnosticsHealthIndicators {

    static final Duration TIMEOUT = Duration.ofSeconds(3);

    private final ReactiveHealthIndicator mongoIndicator;
    private final ReactiveHealthIndicator redisIndicator;

    @Autowired
    public DiagnosticsHealthIndicators(
            ReactiveMongoTemplate reactiveMongoTemplate,
            ReactiveRedisConnectionFactory reactiveRedisConnectionFactory) {
        this(
                new MongoReactiveHealthIndicator(reactiveMongoTemplate),
                new RedisReactiveHealthIndicator(reactiveRedisConnectionFactory));
    }

    DiagnosticsHealthIndicators(ReactiveHealthIndicator mongoIndicator, ReactiveHealthIndicator redisIndicator) {
        this.mongoIndicator = mongoIndicator;
        this.redisIndicator = redisIndicator;
    }

    public Mono<String> mongo() {
        return status(mongoIndicator);
    }

    public Mono<String> redis() {
        return status(redisIndicator);
    }

    /** Never emits an error: a timeout gives {@code UNKNOWN} and any other error gives {@code DOWN}. */
    private static Mono<String> status(ReactiveHealthIndicator indicator) {
        return Mono.defer(indicator::health)
                .map(DiagnosticsHealthIndicators::statusOf)
                .timeout(TIMEOUT)
                .onErrorResume(error -> Mono.just(
                        error instanceof TimeoutException ? DiagnosticsValues.UNKNOWN : DiagnosticsValues.DOWN))
                .defaultIfEmpty(DiagnosticsValues.UNKNOWN);
    }

    private static String statusOf(Health health) {
        String code = health.getStatus() == null ? null : health.getStatus().getCode();
        if (Status.UP.getCode().equals(code)) {
            return DiagnosticsValues.UP;
        }
        if (Status.DOWN.getCode().equals(code)
                || Status.OUT_OF_SERVICE.getCode().equals(code)) {
            return DiagnosticsValues.DOWN;
        }
        return DiagnosticsValues.UNKNOWN;
    }
}
