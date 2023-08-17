package com.appsmith.server.ratelimiting;

import io.github.bucket4j.distributed.BucketProxy;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
public class RateLimitService {

    private final Map<String, BucketProxy> apiBuckets;
    private final RateLimitConfig rateLimitConfig;
    // this number of tokens var can later be customised per API in the configuration.
    private final Integer DEFAULT_NUMBER_OF_TOKENS_CONSUMED_PER_REQUEST = 1;

    public RateLimitService(Map<String, BucketProxy> apiBuckets, RateLimitConfig rateLimitConfig) {
        this.apiBuckets = apiBuckets;
        this.rateLimitConfig = rateLimitConfig;
    }

    public Mono<Boolean> tryIncreaseCounter(String apiIdentifier, String userIdentifier) {
        // handle the case where API itself is not rate limited
        if (!apiBuckets.containsKey(apiIdentifier)) return Mono.just(false);

        BucketProxy userSpecificBucket =
                rateLimitConfig.getOrCreateAPIUserSpecificBucket(apiIdentifier, userIdentifier);
        return Mono.just(userSpecificBucket.tryConsume(DEFAULT_NUMBER_OF_TOKENS_CONSUMED_PER_REQUEST));
    }

    public void resetCounter(String apiIdentifier, String userIdentifier) {
        rateLimitConfig
                .getOrCreateAPIUserSpecificBucket(apiIdentifier, userIdentifier)
                .reset();
    }
}
