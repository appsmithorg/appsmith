package com.appsmith.server.configurations;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;
import io.github.bucket4j.distributed.BucketProxy;
import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class RateLimitConfig {
    // Create a map to store API configurations
    private static final Map<String, BucketConfiguration> apiConfigurations = new HashMap<>();

    static {
        // Define API configurations
        apiConfigurations.put("health-check", createBucketConfiguration(Duration.ofDays(1), 5));
        // Add more API configurations as needed
    }

    @Bean
    public LettuceBasedProxyManager<byte[]> proxyManager() {
        // we will need separate proxy manager for each API and requirements
        return LettuceBasedProxyManager.builderFor(createRedisClient())
                .withExpirationStrategy(ExpirationAfterWriteStrategy.fixedTimeToLive(Duration.ofDays(1)))
                .build();
    }

    @Bean
    public Map<String, BucketProxy> apiBuckets(LettuceBasedProxyManager<byte[]> proxyManager) {
        Map<String, BucketProxy> apiBuckets = new HashMap<>();

        // Populate the apiBuckets map based on your existing apiConfigurations
        apiConfigurations.forEach((apiIdentifier, configuration) -> apiBuckets.put(apiIdentifier, proxyManager.builder().build(apiIdentifier.getBytes(), configuration)));

        return apiBuckets;
    }

    // TODO: Pick up redis client from RedisConfiguration
    private RedisClient createRedisClient() {
        return RedisClient.create("redis://127.0.0.1:6379");
    }

    private static BucketConfiguration createBucketConfiguration(
            Duration refillDuration, int limit) {
        Refill refillConfig = Refill.intervally(limit, refillDuration);
        Bandwidth limitConfig = Bandwidth.classic(limit, refillConfig);
        return BucketConfiguration.builder().addLimit(limitConfig).build();
    }
}