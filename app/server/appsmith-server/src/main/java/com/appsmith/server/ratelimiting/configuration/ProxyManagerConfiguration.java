package com.appsmith.server.ratelimiting.configuration;

import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.AbstractRedisClient;
import io.lettuce.core.RedisClient;
import io.lettuce.core.cluster.RedisClusterClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class ProxyManagerConfiguration {

    private final AbstractRedisClient redisClient;

    public ProxyManagerConfiguration(AbstractRedisClient redisClient) {
        this.redisClient = redisClient;
    }

    @Bean
    public LettuceBasedProxyManager<byte[]> lettuceBasedProxyManager() {
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
}
