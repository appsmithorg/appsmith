package com.appsmith.server.ratelimiting.ce;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.LoadShifter;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.ratelimiting.RateLimitConfig;
import io.github.bucket4j.distributed.BucketProxy;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
public class RateLimitServiceCEImpl implements RateLimitServiceCE {

    private final Map<String, BucketProxy> apiBuckets;
    private final RateLimitConfig rateLimitConfig;
    // this number of tokens can later be customised per API in the configuration.
    private final Integer DEFAULT_NUMBER_OF_TOKENS_CONSUMED_PER_REQUEST = 1;
    // this is required for blocking the execution if bucket exhausted
    private final RedisUtils redisUtils;
    private final String BLOCKED_HOSTNAME_PREFIX = "blocked";

    public RateLimitServiceCEImpl(
            Map<String, BucketProxy> apiBuckets, RateLimitConfig rateLimitConfig, RedisUtils redisUtils) {
        this.apiBuckets = apiBuckets;
        this.rateLimitConfig = rateLimitConfig;
        this.redisUtils = redisUtils;
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
                .subscribeOn(LoadShifter.elasticScheduler);
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
                .subscribeOn(LoadShifter.elasticScheduler);
    }

    /* **************************************************************************************************** */
    /*
     * Following functions are used in case we need to block the endpoint for a specified period of time
     * in case of token exhaustion.
     * For test API and connections, we need to block the execution for 5 minutes if we receive more than
     * 3 failed requests within 5 seconds
     */
    /* **************************************************************************************************** */

    /*
     * This function will add a unique identifier in redis cache for the execution that needs to be blocked
     * along with TTL
     */
    @Override
    public Mono<Boolean> blockEndpointForConnectionRequest(
            String apiIdentifier, String endpointIdentifier, Duration timePeriod, AppsmithException exception) {
        return sanitizeInput(apiIdentifier, endpointIdentifier)
                .flatMap(isInputValid -> {
                    String bucketIdentifier = BLOCKED_HOSTNAME_PREFIX + apiIdentifier + endpointIdentifier;
                    return redisUtils.addFileLock(bucketIdentifier, timePeriod, exception);
                })
                .map(isSuccessful -> {
                    if (TRUE.equals(isSuccessful)) {
                        log.debug(
                                "{} - Rate Limit Exceeded, Blocked endpoint for apiIdentifier = {}, endpointIdentifier = {}",
                                Thread.currentThread().getName(),
                                apiIdentifier,
                                endpointIdentifier);
                    }

                    return isSuccessful;
                })
                // Since we are interacting with redis, we want to make sure that the operation is done on a separate
                // thread pool
                .subscribeOn(LoadShifter.elasticScheduler);
    }

    /*
     * This function checks in the redis cache if blocking key is present, if key is there
     * we block the execution
     */
    @Override
    public Mono<Boolean> isEndpointBlockedForConnectionRequest(String apiIdentifier, String endpointIdentifier) {
        return sanitizeInput(apiIdentifier, endpointIdentifier)
                .flatMap(isInputValid -> {
                    String bucketIdentifier = BLOCKED_HOSTNAME_PREFIX + apiIdentifier + endpointIdentifier;
                    return redisUtils.hasKey(bucketIdentifier);
                })
                .map(isSuccessful -> {
                    if (TRUE.equals(isSuccessful)) {
                        log.debug(
                                "{} - Endpoint is blocked for apiIdentifier = {}, endpointIdentifier = {}",
                                Thread.currentThread().getName(),
                                apiIdentifier,
                                endpointIdentifier);
                    }

                    return isSuccessful;
                })
                // Since we are interacting with redis, we want to make sure that the operation is done on a separate
                // thread pool
                .subscribeOn(LoadShifter.elasticScheduler);
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
                .subscribeOn(LoadShifter.elasticScheduler);
    }
}
