package com.appsmith.server.services.ce;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.data.redis.RedisReactiveHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.concurrent.TimeoutException;
import java.util.function.Function;

@Slf4j
public class HealthCheckServiceCEImpl implements HealthCheckServiceCE {

    private final ReactiveRedisConnectionFactory reactiveRedisConnectionFactory;

    public HealthCheckServiceCEImpl(ReactiveRedisConnectionFactory reactiveRedisConnectionFactory) {
        this.reactiveRedisConnectionFactory = reactiveRedisConnectionFactory;
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
        // TODO: Add health check for Postgres.
        return Mono.empty();
    }
}
