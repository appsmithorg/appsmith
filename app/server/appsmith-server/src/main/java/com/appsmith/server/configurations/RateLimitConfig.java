package com.appsmith.server.configurations;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;

@Configuration
public class RateLimitConfig {
    @Bean
    public RedisRateLimiter redisRateLimiter() {
        // Create and configure a custom RedisRateLimiter
        return new RedisRateLimiter(5, 10); // Example: 5 requests per 10 seconds
    }
}
