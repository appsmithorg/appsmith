package com.appsmith.server.services;

import io.github.bucket4j.distributed.BucketProxy;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class RateLimitService {

    private final BucketProxy rateLimitBucket;

    public RateLimitService(BucketProxy rateLimitBucket) {
        this.rateLimitBucket = rateLimitBucket;
    }

    public Mono<Boolean> checkRateLimit() {
        return Mono.fromCallable(() -> rateLimitBucket.tryConsume(1));
    }
}