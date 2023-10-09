package com.appsmith.server.ratelimiting.ce;

import reactor.core.publisher.Mono;

public interface RateLimitServiceCE {
    Mono<Boolean> tryIncreaseCounter(String apiIdentifier, String userIdentifier);

    void resetCounter(String apiIdentifier, String userIdentifier);
}
