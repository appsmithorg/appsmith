package com.appsmith.server.services.ce;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.data.redis.health.DataRedisReactiveHealthIndicator;
import org.springframework.boot.health.contributor.Health;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
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
    private final ReactiveMongoTemplate reactiveMongoTemplate;
    private final ObservationRegistry observationRegistry;

    public HealthCheckServiceCEImpl(
            ReactiveRedisConnectionFactory reactiveRedisConnectionFactory,
            ReactiveMongoTemplate reactiveMongoTemplate,
            ObservationRegistry observationRegistry) {
        this.reactiveRedisConnectionFactory = reactiveRedisConnectionFactory;
        this.reactiveMongoTemplate = reactiveMongoTemplate;
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
        DataRedisReactiveHealthIndicator redisReactiveHealthIndicator =
                new DataRedisReactiveHealthIndicator(reactiveRedisConnectionFactory);
        return redisReactiveHealthIndicator
                .health()
                .timeout(Duration.ofSeconds(3))
                .onErrorMap(TimeoutException.class, healthTimeout)
                .name(REDIS_HEALTH)
                .tap(Micrometer.observation(observationRegistry));
    }

    private Mono<Health> getMongoHealth() {
        Function<TimeoutException, Throwable> healthTimeout = error -> {
            log.warn("MongoDB health check timed out: {}", error.getMessage());
            return new AppsmithException(AppsmithError.HEALTHCHECK_TIMEOUT, "Mongo");
        };
        // Spring Boot 4's MongoReactiveHealthIndicator calls listDatabaseNames, which needs the listDatabases
        // privilege. Keep the Spring Boot 3 check: a `hello` command, and a DOWN result (not an error) on failure.
        return reactiveMongoTemplate
                .executeCommand("{ hello: 1 }")
                .map(document -> Health.up()
                        .withDetail("maxWireVersion", document.getInteger("maxWireVersion"))
                        .build())
                .onErrorResume(error -> Mono.just(Health.down(error).build()))
                .timeout(Duration.ofSeconds(1))
                .onErrorMap(TimeoutException.class, healthTimeout)
                .name(MONGO_HEALTH)
                .tap(Micrometer.observation(observationRegistry));
    }
}
