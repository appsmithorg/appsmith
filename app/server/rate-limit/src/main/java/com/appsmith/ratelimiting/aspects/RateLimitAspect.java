package com.appsmith.ratelimiting.aspects;

import com.appsmith.ratelimiting.RateLimitConfig;
import io.github.bucket4j.distributed.BucketProxy;
import com.appsmith.ratelimiting.annotations.RateLimit;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Aspect
@Component
public class RateLimitAspect {

    private final RateLimitConfig rateLimitConfig;

    public RateLimitAspect(RateLimitConfig rateLimitConfig) {
        this.rateLimitConfig = rateLimitConfig;
    }

    @AfterReturning(value = "@annotation(rateLimit)", returning = "result")
    public Object applyRateLimit(RateLimit rateLimit, Object result) {
        String apiIdentifier = rateLimit.api();
        String userIdentifier = rateLimit.userIdentifier();

        BucketProxy userSpecificBucket = rateLimitConfig.getOrCreateAPIUserSpecificBucket(apiIdentifier, userIdentifier);
        boolean isAllowed = userSpecificBucket.tryConsume(1);

        if (!isAllowed) {
            return Mono.error(new Exception("Rate limit exceeded"));
        }

        return Mono.just(result);
    }
}