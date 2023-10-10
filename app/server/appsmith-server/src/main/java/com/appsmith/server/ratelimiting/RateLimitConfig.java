package com.appsmith.server.ratelimiting;

import com.appsmith.server.constants.RateLimitConstants;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;
import io.github.bucket4j.distributed.BucketProxy;
import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.AbstractRedisClient;
import io.lettuce.core.RedisClient;
import io.lettuce.core.cluster.RedisClusterClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Configuration
@Slf4j
public class RateLimitConfig {
    private static final Map<String, BucketConfiguration> apiConfigurationMap = new HashMap<>();

    @Autowired
    private final AbstractRedisClient redisClient;

    public RateLimitConfig(AbstractRedisClient redisClient) {
        this.redisClient = redisClient;
    }

    static {
        apiConfigurationMap.put(
                RateLimitConstants.BUCKET_KEY_FOR_LOGIN_API, createBucketConfiguration(Duration.ofDays(1), 5));
        apiConfigurationMap.put(
                RateLimitConstants.BUCKET_KEY_FOR_TEST_DATASOURCE_API,
                createBucketConfiguration(Duration.ofSeconds(5), 3));
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

        if (redisClient instanceof RedisClusterClient) {
            return LettuceBasedProxyManager.builderFor((RedisClusterClient) redisClient)
                    .withExpirationStrategy(ExpirationAfterWriteStrategy.fixedTimeToLive(longExpiration))
                    .build();
        }

        return LettuceBasedProxyManager.builderFor((RedisClient) redisClient)
                .withExpirationStrategy(ExpirationAfterWriteStrategy.fixedTimeToLive(longExpiration))
                .build();
    }

    @Bean
    public Map<String, BucketProxy> apiBuckets() {
        Map<String, BucketProxy> apiBuckets = new HashMap<>();

        apiConfigurationMap.forEach((apiIdentifier, configuration) ->
                apiBuckets.put(apiIdentifier, proxyManager().builder().build(apiIdentifier.getBytes(), configuration)));

        return apiBuckets;
    }

    public BucketProxy getOrCreateAPIUserSpecificBucket(String apiIdentifier, String userId) {
        String bucketIdentifier = apiIdentifier + userId;
        Optional<BucketConfiguration> bucketProxy = proxyManager().getProxyConfiguration(bucketIdentifier.getBytes());
        if (bucketProxy.isPresent()) {
            return proxyManager().builder().build(bucketIdentifier.getBytes(), bucketProxy.get());
        }

        return proxyManager().builder().build(bucketIdentifier.getBytes(), apiConfigurationMap.get(apiIdentifier));
    }

    private static BucketConfiguration createBucketConfiguration(Duration refillDuration, int limit) {
        Refill refillConfig = Refill.intervally(limit, refillDuration);
        Bandwidth limitConfig = Bandwidth.classic(limit, refillConfig);
        return BucketConfiguration.builder().addLimit(limitConfig).build();
    }
}
