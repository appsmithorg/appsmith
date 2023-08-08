package com.appsmith.server.services;

import org.springframework.cloud.gateway.filter.ratelimit.RateLimiter;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class RateLimitService {

    private final RedisRateLimiter rateLimiter;

    public RateLimitService(RedisRateLimiter rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    public Mono<Boolean> checkRateLimit(String routeId, KeyResolver keyResolver) {
        return keyResolver.resolve(null)  // You may need to provide a ServerWebExchange here
                .flatMap(key -> {
                    String id = routeId + ":" + key;
                    return rateLimiter.isAllowed(routeId, id)
                            .map(response -> response.isAllowed());
                });
    }
}