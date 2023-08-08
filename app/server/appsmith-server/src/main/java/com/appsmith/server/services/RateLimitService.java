package com.appsmith.server.services;

import org.springframework.cloud.gateway.filter.ratelimit.RateLimiter;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class RateLimitService {

    private final RedisRateLimiter rateLimiter;

    public RateLimitService(RedisRateLimiter rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    public Mono<Boolean> checkRateLimit(String routeId, String identifier) {
        String id = "identifier:" + identifier; // Set your identifier prefix

        return rateLimiter.isAllowed(routeId, id)
                .map(RateLimiter.Response::isAllowed);
    }
}