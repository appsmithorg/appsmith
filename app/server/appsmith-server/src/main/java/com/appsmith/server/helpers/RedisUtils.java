package com.appsmith.server.helpers;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class RedisUtils {
    private final ReactiveRedisOperations<String, String> redisOperations;

    private static final String REDIS_FILE_LOCK_VALUE = "inUse";

    private static final Duration FILE_LOCK_TIME_LIMIT = Duration.ofSeconds(20);

    public Mono<Boolean> addFileLock(String key) {
        return this.addFileLock(key, FILE_LOCK_TIME_LIMIT, new AppsmithException(AppsmithError.GIT_FILE_IN_USE));
    }

    public Mono<Boolean> addFileLock(String key, Duration expirationPeriod, AppsmithException exception) {
        return redisOperations.hasKey(key).flatMap(isKeyPresent -> {
            if (Boolean.TRUE.equals(isKeyPresent)) {
                return Mono.error(exception);
            }
            return redisOperations.opsForValue().set(key, REDIS_FILE_LOCK_VALUE, expirationPeriod);
        });
    }

    public Mono<Boolean> releaseFileLock(String key) {
        return redisOperations.opsForValue().delete(key);
    }

    public Mono<Boolean> hasKey(String key) {
        return redisOperations.hasKey(key);
    }
}
