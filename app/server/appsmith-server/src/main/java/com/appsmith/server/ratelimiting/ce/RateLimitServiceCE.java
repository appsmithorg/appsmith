package com.appsmith.server.ratelimiting.ce;

import com.appsmith.server.exceptions.AppsmithException;
import reactor.core.publisher.Mono;

import java.time.Duration;

public interface RateLimitServiceCE {
    /**
     * Atomically consumes one token, returning whether the caller may proceed. This is the only valid rate-limit
     * gate: a non-consuming "how many tokens are left" check is not, because concurrent callers all observe the
     * same pre-consumption count and all pass, admitting as many simultaneous requests as arrive rather than the
     * configured limit.
     */
    Mono<Boolean> tryIncreaseCounter(String apiIdentifier, String userIdentifier);

    Mono<Void> resetCounter(String apiIdentifier, String userIdentifier);

    Mono<Boolean> blockEndpointForConnectionRequest(
            String apiIdentifier, String endpointIdentifier, Duration blockingTime, AppsmithException exception);

    Mono<Boolean> isEndpointBlockedForConnectionRequest(String apiIdentifier, String endpointIdentifier);
}
