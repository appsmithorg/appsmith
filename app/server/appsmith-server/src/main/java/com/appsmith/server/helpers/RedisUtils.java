package com.appsmith.server.helpers;

import com.appsmith.server.dtos.AutoCommitProgressDTO;
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

    private static final String AUTO_COMMIT_KEY_FORMAT = "autocommit_%s";

    private static final Duration FILE_LOCK_TIME_LIMIT = Duration.ofSeconds(20);

    private static final Duration AUTO_COMMIT_TIME_LIMIT = Duration.ofMinutes(3);

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

    public Mono<Boolean> startAutoCommit(String defaultApplicationId, String branchName) {
        String key = String.format(AUTO_COMMIT_KEY_FORMAT, defaultApplicationId);
        return redisOperations.hasKey(key).flatMap(isKeyPresent -> {
            if (Boolean.TRUE.equals(isKeyPresent)) {
                return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_IN_USE));
            }
            // value will be the progress
            return redisOperations.opsForValue().set(key, branchName, AUTO_COMMIT_TIME_LIMIT);
        });
    }

    public Mono<Boolean> finishAutoCommit(String defaultApplicationId) {
        String key = String.format(AUTO_COMMIT_KEY_FORMAT, defaultApplicationId);
        return redisOperations.opsForValue().delete(key);
    }

    public Mono<Boolean> isAutoCommitRunning(String defaultApplicationId) {
        String key = String.format(AUTO_COMMIT_KEY_FORMAT, defaultApplicationId);
        return redisOperations.hasKey(key);
    }

    public Mono<AutoCommitProgressDTO> getAutoCommitStatus(String defaultApplicationId) {
        String key = String.format(AUTO_COMMIT_KEY_FORMAT, defaultApplicationId);
        return redisOperations.hasKey(key).flatMap(isKeyPresent -> {
            if (isKeyPresent) {
                return redisOperations.opsForValue().get(key).map(value -> {
                    AutoCommitProgressDTO autoCommitProgressDTO = new AutoCommitProgressDTO();
                    autoCommitProgressDTO.setRunning(true);
                    autoCommitProgressDTO.setBranchName(value);
                    return autoCommitProgressDTO;
                });
            } else {
                AutoCommitProgressDTO autoCommitProgressDTO = new AutoCommitProgressDTO();
                autoCommitProgressDTO.setRunning(false);
                return Mono.just(autoCommitProgressDTO);
            }
        });
    }
}
