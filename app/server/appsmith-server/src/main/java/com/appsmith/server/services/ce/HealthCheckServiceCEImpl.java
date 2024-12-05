package com.appsmith.server.services.ce;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.data.redis.RedisReactiveHealthIndicator;
import org.springframework.boot.actuate.health.Health;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.concurrent.TimeoutException;
import java.util.function.Function;

import static com.appsmith.external.constants.spans.ce.HealthSpanCE.MONGO_HEALTH;
import static com.appsmith.external.constants.spans.ce.HealthSpanCE.REDIS_HEALTH;

@Slf4j
public class HealthCheckServiceCEImpl implements HealthCheckServiceCE {

    private final ReactiveRedisConnectionFactory reactiveRedisConnectionFactory;
    private final ObservationRegistry observationRegistry;

    public HealthCheckServiceCEImpl(
            ReactiveRedisConnectionFactory reactiveRedisConnectionFactory,
            ObservationRegistry observationRegistry) {
        this.reactiveRedisConnectionFactory = reactiveRedisConnectionFactory;
        this.observationRegistry = observationRegistry;
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
                .onErrorMap(TimeoutException.class, healthTimeout)
                .name(REDIS_HEALTH)
                .tap(Micrometer.observation(observationRegistry));
    }

    private Mono<Health> getMongoHealth() {
        // TODO: Add health check for Postgres.
        return Mono.empty();
    }
}
