package com.appsmith.server.ratelimiting.ce;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.ratelimiting.RateLimitConfig;
import io.github.bucket4j.distributed.BucketProxy;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.util.Map;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
public class RateLimitServiceCEImpl implements RateLimitServiceCE {

    private final Scheduler scheduler = Schedulers.boundedElastic();
    private final Map<String, BucketProxy> apiBuckets;
    private final RateLimitConfig rateLimitConfig;
    // this number of tokens var can later be customised per API in the configuration.
    private final Integer DEFAULT_NUMBER_OF_TOKENS_CONSUMED_PER_REQUEST = 1;

    public RateLimitServiceCEImpl(Map<String, BucketProxy> apiBuckets, RateLimitConfig rateLimitConfig) {
        this.apiBuckets = apiBuckets;
        this.rateLimitConfig = rateLimitConfig;
    }

    @Override
    public Mono<Boolean> tryIncreaseCounter(String apiIdentifier, String userIdentifier) {

        return sanitizeInput(apiIdentifier, userIdentifier)
                .flatMap(isInputValid -> {
                    BucketProxy userSpecificBucket =
                            rateLimitConfig.getOrCreateAPIUserSpecificBucket(apiIdentifier, userIdentifier);

                    return Mono.just(userSpecificBucket.tryConsume(DEFAULT_NUMBER_OF_TOKENS_CONSUMED_PER_REQUEST));
                })
                .map(isSuccessful -> {
                    if (FALSE.equals(isSuccessful)) {
                        log.debug(
                                "{} - Rate Limit exceeded for apiIdentifier = {}, userIdentifier = {}",
                                Thread.currentThread().getName(),
                                apiIdentifier,
                                userIdentifier);
                    }

                    return isSuccessful;
                })
                // Since we are interacting with redis, we want to make sure that the operation is done on a separate
                // thread pool
                .subscribeOn(scheduler);
    }

    @Override
    public Mono<Void> resetCounter(String apiIdentifier, String userIdentifier) {

        return sanitizeInput(apiIdentifier, userIdentifier)
                .flatMap(isInputValid -> {
                    rateLimitConfig
                            .getOrCreateAPIUserSpecificBucket(apiIdentifier, userIdentifier)
                            .reset();

                    return Mono.just(TRUE);
                })
                .then()
                // Since we are interacting with redis, we want to make sure that the operation is done on a separate
                // thread pool
                .subscribeOn(scheduler);
    }

    private Mono<Boolean> sanitizeInput(String apiIdentifier, String userIdentifier) {
        if (userIdentifier == null) {
            return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
        }

        return Mono.just(userIdentifier)
                .flatMap(username -> {
                    // Handle the case where API itself is not rate limited.
                    if (!apiBuckets.containsKey(apiIdentifier)) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }

                    return Mono.just(true);
                })
                .subscribeOn(scheduler);
    }
}
