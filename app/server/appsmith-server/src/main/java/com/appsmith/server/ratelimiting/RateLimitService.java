package com.appsmith.server.ratelimiting;

import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.RedisUtils;
import io.github.bucket4j.distributed.BucketProxy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

@Slf4j
@Service
public class RateLimitService {

    private final Map<String, BucketProxy> apiBuckets;
    private final RateLimitConfig rateLimitConfig;
    // this number of tokens var can later be customised per API in the configuration.

    private final Integer DEFAULT_NUMBER_OF_TOKENS_CONSUMED_PER_REQUEST = 1;
    // this is required for blocking the execution if bucket exhausted
    private final RedisUtils redisUtils;
    private final String BLOCKED_HOSTNAME_PREFIX = "blocked";

    public RateLimitService(
            Map<String, BucketProxy> apiBuckets, RateLimitConfig rateLimitConfig, RedisUtils redisUtils) {
        this.apiBuckets = apiBuckets;
        this.rateLimitConfig = rateLimitConfig;
        this.redisUtils = redisUtils;
    }

    public Mono<Boolean> tryIncreaseCounter(String apiIdentifier, String userIdentifier) {
        log.debug(
                "RateLimitService.tryIncreaseCounter() called with apiIdentifier = {}, userIdentifier = {}",
                apiIdentifier,
                userIdentifier);
        // handle the case where API itself is not rate limited
        log.debug(
                apiBuckets.containsKey(apiIdentifier) ? "apiBuckets contains key" : "apiBuckets does not contain key");
        if (!apiBuckets.containsKey(apiIdentifier)) return Mono.just(false);

        BucketProxy userSpecificBucket =
                rateLimitConfig.getOrCreateAPIUserSpecificBucket(apiIdentifier, userIdentifier);
        log.debug("userSpecificBucket = {}", userSpecificBucket);
        return Mono.just(userSpecificBucket.tryConsume(DEFAULT_NUMBER_OF_TOKENS_CONSUMED_PER_REQUEST));
    }

    public void resetCounter(String apiIdentifier, String userIdentifier) {
        rateLimitConfig
                .getOrCreateAPIUserSpecificBucket(apiIdentifier, userIdentifier)
                .reset();
    }

    public Mono<Boolean> blockExecutionForPeriod(
            String apiIdentifier, String userIdentifier, Duration timePeriod, AppsmithException exception) {
        String bucketIdentifier = BLOCKED_HOSTNAME_PREFIX + apiIdentifier + userIdentifier;
        return redisUtils.addFileLock(bucketIdentifier, timePeriod, exception);
    }

    public Mono<Boolean> isBlockingKeyPresent(String apiIdentifier, String userIdentifier) {
        String bucketIdentifier = BLOCKED_HOSTNAME_PREFIX + apiIdentifier + userIdentifier;
        return redisUtils.hasKey(bucketIdentifier);
    }
}
