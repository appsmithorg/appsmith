package com.appsmith.server.helpers;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import org.springframework.data.redis.core.ReactiveRedisOperations;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class RedisUtils {
    private final ReactiveRedisOperations<String, String> redisOperations;

    private final static String REDIS_FILE_LOCK_VALUE= "inUse";

    private final static Duration FILE_LOCK_TIME_LIMIT = Duration.ofSeconds(20);

    public Mono<Boolean> addFileLock(String key) {
        return redisOperations.hasKey(key)
                .flatMap(isKeyPresent -> {
                    if(Boolean.TRUE.equals(isKeyPresent)) {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_IN_USE));
                    }
                    return redisOperations.opsForValue().set(key, REDIS_FILE_LOCK_VALUE, FILE_LOCK_TIME_LIMIT);
                });
    }

    public Mono<Boolean> releaseFileLock(String key) {
        return redisOperations.opsForValue().delete(key);
    }
}
