package com.appsmith.server.services;

import io.github.bucket4j.distributed.BucketProxy;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
public class RateLimitService {

    private final Map<String, BucketProxy> apiBuckets;

    public RateLimitService(Map<String, BucketProxy> apiBuckets) {
        this.apiBuckets = apiBuckets;
    }

    public Mono<Boolean> checkRateLimit(String apiIdentifier) {
        if (!apiBuckets.containsKey(apiIdentifier)) {
            // Handle the case where the provided API identifier is not recognized
            return Mono.just(false);
        }

        BucketProxy rateLimitBucket = apiBuckets.get(apiIdentifier);
        return Mono.fromCallable(() -> rateLimitBucket.tryConsume(1));
    }
}
