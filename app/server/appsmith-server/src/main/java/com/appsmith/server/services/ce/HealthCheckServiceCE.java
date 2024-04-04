package com.appsmith.server.services.ce;

import reactor.core.publisher.Mono;

public interface HealthCheckServiceCE {
    Mono<String> getHealth();
}
