package com.appsmith.server.services.ce;

import org.springframework.boot.actuate.health.Health;
import reactor.core.publisher.Mono;

public interface HealthCheckServiceCE {

    Mono<String> getHealth();

    Mono<Health> getRedisHealth();

    Mono<Health> getMongoHealth();
}
