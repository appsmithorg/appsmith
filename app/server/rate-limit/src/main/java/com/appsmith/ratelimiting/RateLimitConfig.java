package com.appsmith.ratelimiting;

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
import java.util.Optional;

@Configuration
public class RateLimitConfig {
    private static final Map<String, BucketConfiguration> apiConfigurations = new HashMap<>();

    static {
        apiConfigurations.put("health-check", createBucketConfiguration(Duration.ofDays(1), 5));
        // Add more API configurations as needed
    }

    @Bean
    public LettuceBasedProxyManager<byte[]> proxyManager() {
        return LettuceBasedProxyManager.builderFor(createRedisClient())
                .withExpirationStrategy(ExpirationAfterWriteStrategy.fixedTimeToLive(Duration.ofDays(1)))
                .build();
    }

    @Bean
    public Map<String, BucketProxy> apiBuckets() {
        Map<String, BucketProxy> apiBuckets = new HashMap<>();

        apiConfigurations.forEach((apiIdentifier, configuration) -> apiBuckets.put(apiIdentifier, proxyManager().builder().build(apiIdentifier.getBytes(), configuration)));

        return apiBuckets;
    }

    public BucketProxy getOrCreateAPIUserSpecificBucket(String apiIdentifier, String userId) {
        String bucketIdentifier = apiIdentifier + userId;
        Optional<BucketConfiguration> bucketProxy = proxyManager().getProxyConfiguration(bucketIdentifier.getBytes());
        if (bucketProxy.isPresent()) {
            return proxyManager().builder().build(bucketIdentifier.getBytes(), bucketProxy.get());
        }

        return proxyManager().builder().build(bucketIdentifier.getBytes(), apiConfigurations.get(apiIdentifier));
    }

    private RedisClient createRedisClient() {
        return RedisClient.create("redis://127.0.0.1:6379");
    }

    private static BucketConfiguration createBucketConfiguration(Duration refillDuration, int limit) {
        Refill refillConfig = Refill.intervally(limit, refillDuration);
        Bandwidth limitConfig = Bandwidth.classic(limit, refillConfig);
        return BucketConfiguration.builder().addLimit(limitConfig).build();
    }
}
