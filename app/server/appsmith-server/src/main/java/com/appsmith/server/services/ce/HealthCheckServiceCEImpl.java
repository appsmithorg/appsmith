package com.appsmith.server.services.ce;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.data.mongo.MongoReactiveHealthIndicator;
import org.springframework.boot.actuate.data.redis.RedisReactiveHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.concurrent.TimeoutException;
import java.util.function.Function;

@Slf4j
public class HealthCheckServiceCEImpl implements HealthCheckServiceCE {

    private final ReactiveRedisConnectionFactory reactiveRedisConnectionFactory;
    private final ReactiveMongoTemplate reactiveMongoTemplate;

    public HealthCheckServiceCEImpl(
            ReactiveRedisConnectionFactory reactiveRedisConnectionFactory,
            ReactiveMongoTemplate reactiveMongoTemplate) {
        this.reactiveRedisConnectionFactory = reactiveRedisConnectionFactory;
        this.reactiveMongoTemplate = reactiveMongoTemplate;
    }

    @Override
    public Mono<String> getHealth() {
        return Mono.when(getRedisHealth(), getMongoHealth()).thenReturn("All systems are up");
    }

    private Mono<Health> getRedisHealth() {
        Function<TimeoutException, Throwable> healthTimeout = error -> {
            log.warn("Redis health check timed out: {}", error.getMessage());
            return new AppsmithException(AppsmithError.HEALTHCHECK_TIMEOUT, "Redis");
        };
        RedisReactiveHealthIndicator redisReactiveHealthIndicator =
                new RedisReactiveHealthIndicator(reactiveRedisConnectionFactory);
        return redisReactiveHealthIndicator
                .health()
                .timeout(Duration.ofSeconds(3))
                .onErrorMap(TimeoutException.class, healthTimeout);
    }

    private Mono<Health> getMongoHealth() {
        Function<TimeoutException, Throwable> healthTimeout = error -> {
            log.warn("MongoDB health check timed out: {}", error.getMessage());
            return new AppsmithException(AppsmithError.HEALTHCHECK_TIMEOUT, "Mongo");
        };
        MongoReactiveHealthIndicator mongoReactiveHealthIndicator =
                new MongoReactiveHealthIndicator(reactiveMongoTemplate);
        return mongoReactiveHealthIndicator
                .health()
                .timeout(Duration.ofSeconds(1))
                .onErrorMap(TimeoutException.class, healthTimeout);
    }
}
