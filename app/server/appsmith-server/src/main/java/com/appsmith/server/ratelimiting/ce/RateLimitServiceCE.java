package com.appsmith.server.ratelimiting.ce;

import com.appsmith.server.exceptions.AppsmithException;
import reactor.core.publisher.Mono;

import java.time.Duration;

public interface RateLimitServiceCE {
    Mono<Boolean> tryIncreaseCounter(String apiIdentifier, String userIdentifier);

    Mono<Void> resetCounter(String apiIdentifier, String userIdentifier);

    Mono<Boolean> blockEndpointForConnectionRequest(
            String apiIdentifier, String endpointIdentifier, Duration blockingTime, AppsmithException exception);

    Mono<Boolean> isEndpointBlockedForConnectionRequest(String apiIdentifier, String endpointIdentifier);
}
