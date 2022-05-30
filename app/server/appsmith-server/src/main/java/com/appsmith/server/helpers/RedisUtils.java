package com.appsmith.server.helpers;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

import org.springframework.data.redis.core.ReactiveRedisOperations;

import java.nio.file.Path;
import java.time.Duration;

@RequiredArgsConstructor
public class RedisUtils {
    private static ReactiveRedisOperations<String, String> redisOperations;

    private final static String REDIS_FILE_LOCK_VALUE= "inUse";

    private final static String REDIS_FILE_RELEASE_VALUE = "isFree";

    private final static Duration FILE_LOCK_TIME_LIMIT = Duration.ofSeconds(20);

    public static Mono<Boolean> addFileLock(String key) {
        return redisOperations.opsForValue().get(key)
                .flatMap(object -> {
                    if (object.equals(REDIS_FILE_RELEASE_VALUE)) {
                        return redisOperations.opsForValue().set(key, REDIS_FILE_LOCK_VALUE, FILE_LOCK_TIME_LIMIT);
                    } else {
                        return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_IN_USE));
                    }
                })
                .switchIfEmpty(redisOperations.opsForValue().set(key, REDIS_FILE_LOCK_VALUE, FILE_LOCK_TIME_LIMIT));
    }

    public static Mono<Boolean> releaseFileLock(String key) {
        return redisOperations.opsForValue().set(key, REDIS_FILE_RELEASE_VALUE, FILE_LOCK_TIME_LIMIT);
    }
}
