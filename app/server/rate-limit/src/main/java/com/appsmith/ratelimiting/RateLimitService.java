package com.appsmith.ratelimiting;

import io.github.bucket4j.distributed.BucketProxy;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
public class RateLimitService {

    private final Map<String, BucketProxy> apiBuckets;
    private final RateLimitConfig rateLimitConfig;

    public RateLimitService(Map<String, BucketProxy> apiBuckets, RateLimitConfig rateLimitConfig) {
        this.apiBuckets = apiBuckets;
        this.rateLimitConfig = rateLimitConfig;
    }

    public Mono<Boolean> tryIncreaseCounter(String apiIdentifier, String userIdentifier) {
        // handle the case where API itself is not rate limited
        if (!apiBuckets.containsKey(apiIdentifier)) return Mono.just(false);

        BucketProxy userSpecificBucket = rateLimitConfig.getOrCreateAPIUserSpecificBucket(apiIdentifier, userIdentifier);
        return Mono.just(userSpecificBucket.tryConsume(1));
    }

    public void resetCounter(String apiIdentifier, String userIdentifier) {
        rateLimitConfig.getOrCreateAPIUserSpecificBucket(apiIdentifier, userIdentifier).reset();
    }
}
