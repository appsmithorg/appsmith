package com.appsmith.server.ratelimiting.solutions;

import com.appsmith.server.ratelimiting.domains.RateLimit;
import io.github.bucket4j.distributed.BucketProxy;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface RateLimitSolutionCE {
    Map<String, BucketProxy> getApiProxyBuckets();

    Mono<Long> updateApiProxyBucketForApiIdentifier(String apiIdentifier, RateLimit rateLimit);

    BucketProxy getOrCreateAPIUserSpecificBucket(String apiIdentifier, String userId);
}
