package com.appsmith.server.configurations;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;
import io.github.bucket4j.distributed.BucketProxy;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitConfig {

    @Bean
    public LettuceBasedProxyManager<byte[]> proxyManager() {
        return LettuceBasedProxyManager.builderFor(createRedisClient()).build();
    }

    @Bean
    public BucketProxy rateLimitBucket(LettuceBasedProxyManager<byte[]> proxyManager) {
        // TODO: Make this configurable
        Refill refill = Refill.intervally(5, Duration.ofDays(1)); // Refill 5 tokens every day
        Bandwidth limit = Bandwidth.classic(5, refill);

        BucketConfiguration configuration = BucketConfiguration.builder()
                .addLimit(limit)
                .build();

        // TODO: Each API should have it's own bucket which can be the route + the identifier
        // we can use an map of buckets to do this
        return proxyManager.builder().build("key".getBytes(), configuration);
    }

    // TODO: Pick up redis client from RedisConfiguration
    private RedisClient createRedisClient() {
        return RedisClient.create("redis://127.0.0.1:6379");
    }
}