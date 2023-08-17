package com.appsmith.server.ratelimiting;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;
import io.github.bucket4j.distributed.BucketProxy;
import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Configuration
public class RateLimitConfig {
    private static final Map<String, BucketConfiguration> apiConfigurations = new HashMap<>();

    @Autowired
    private final RedisClient redisClient;

    public RateLimitConfig(RedisClient redisClient) {
        this.redisClient = redisClient;
    }

    static {
        apiConfigurations.put("authentication", createBucketConfiguration(Duration.ofDays(1), 5));
        // Add more API configurations as needed
    }

    @Bean
    public LettuceBasedProxyManager<byte[]> proxyManager() {
        /*
         we want a single proxyManager to manage all buckets.
         If we set too short an expiration time,
         the proxyManager expires and renews the buckets with their initial configuration
        */
        Duration longExpiration = Duration.ofDays(3650); // 10 years
        return LettuceBasedProxyManager.builderFor(redisClient)
                .withExpirationStrategy(ExpirationAfterWriteStrategy.fixedTimeToLive(longExpiration))
                .build();
    }

    @Bean
    public Map<String, BucketProxy> apiBuckets() {
        Map<String, BucketProxy> apiBuckets = new HashMap<>();

        apiConfigurations.forEach((apiIdentifier, configuration) ->
                apiBuckets.put(apiIdentifier, proxyManager().builder().build(apiIdentifier.getBytes(), configuration)));

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

    private static BucketConfiguration createBucketConfiguration(Duration refillDuration, int limit) {
        Refill refillConfig = Refill.intervally(limit, refillDuration);
        Bandwidth limitConfig = Bandwidth.classic(limit, refillConfig);
        return BucketConfiguration.builder().addLimit(limitConfig).build();
    }
}
