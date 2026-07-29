package com.appsmith.server.ratelimiting.ce;

import com.appsmith.server.exceptions.AppsmithException;
import reactor.core.publisher.Mono;

import java.time.Duration;

public interface RateLimitServiceCE {
    Mono<Boolean> tryIncreaseCounter(String apiIdentifier, String userIdentifier);

    /**
     * Observes whether the bucket is currently empty, without consuming anything.
     *
     * <p><b>Not a rate-limit gate.</b> Because it does not consume, concurrent callers all observe the same
     * pre-consumption count and all pass, so guarding work with this admits as many simultaneous requests as arrive
     * rather than the configured limit. Use {@link #tryIncreaseCounter(String, String)} — a single atomic consume —
     * to decide whether a request may proceed. This method is for reporting the current state only.
     */
    Mono<Boolean> isRateLimitExceeded(String apiIdentifier, String userIdentifier);

    Mono<Void> resetCounter(String apiIdentifier, String userIdentifier);

    Mono<Boolean> blockEndpointForConnectionRequest(
            String apiIdentifier, String endpointIdentifier, Duration blockingTime, AppsmithException exception);

    Mono<Boolean> isEndpointBlockedForConnectionRequest(String apiIdentifier, String endpointIdentifier);
}
