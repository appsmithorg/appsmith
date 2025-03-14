package com.appsmith.server.helpers;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.nio.ByteBuffer;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

import static com.appsmith.external.git.constants.ce.GitConstantsCE.GitCommandConstantsCE.AUTO_COMMIT;
import static com.appsmith.server.services.ce.SessionUserServiceCEImpl.SPRING_SESSION_PATTERN;
import static org.springframework.util.StringUtils.hasText;

@Component
@RequiredArgsConstructor
@Slf4j
public class RedisUtils {
    private final ReactiveRedisOperations<String, String> redisOperations;

    private static final String REDIS_FILE_LOCK_VALUE = "inUse";

    private static final String AUTO_COMMIT_KEY_FORMAT = "autocommit_%s";
    private static final String AUTO_COMMIT_PROGRESS_KEY_FORMAT = "autocommit_progress_%s";

    private static final Duration FILE_LOCK_TIME_LIMIT = Duration.ofSeconds(120);

    private static final Duration AUTO_COMMIT_TIME_LIMIT = Duration.ofMinutes(3);

    public Mono<Boolean> addFileLock(String key, String gitCommand) {
        String command = hasText(gitCommand) ? gitCommand : REDIS_FILE_LOCK_VALUE;
        return redisOperations.hasKey(key).flatMap(isKeyPresent -> {
            if (!Boolean.TRUE.equals(isKeyPresent)) {
                return redisOperations.opsForValue().set(key, gitCommand, FILE_LOCK_TIME_LIMIT);
            }
            return redisOperations
                    .opsForValue()
                    .get(key)
                    .flatMap(commandName ->
                            Mono.error(new AppsmithException(AppsmithError.GIT_FILE_IN_USE, command, commandName)));
        });
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
                return Mono.error(new AppsmithException(AppsmithError.GIT_FILE_IN_USE, AUTO_COMMIT, AUTO_COMMIT));
            }
            return redisOperations.opsForValue().set(key, branchName, AUTO_COMMIT_TIME_LIMIT);
        });
    }

    public Mono<Boolean> setAutoCommitProgress(String defaultApplicationId, Integer progress) {
        String key = String.format(AUTO_COMMIT_PROGRESS_KEY_FORMAT, defaultApplicationId);
        return redisOperations.opsForValue().set(key, String.valueOf(progress), AUTO_COMMIT_TIME_LIMIT);
    }

    public Mono<Integer> getAutoCommitProgress(String defaultApplicationId) {
        String key = String.format(AUTO_COMMIT_PROGRESS_KEY_FORMAT, defaultApplicationId);
        return redisOperations.opsForValue().get(key).map(Integer::valueOf);
    }

    public Mono<Boolean> finishAutoCommit(String defaultApplicationId) {
        String key = String.format(AUTO_COMMIT_KEY_FORMAT, defaultApplicationId);
        return redisOperations.opsForValue().delete(key);
    }

    public Mono<String> getRunningAutoCommitBranchName(String defaultApplicationId) {
        String key = String.format(AUTO_COMMIT_KEY_FORMAT, defaultApplicationId);
        return redisOperations.hasKey(key).flatMap(hasKey -> {
            if (hasKey) {
                return redisOperations.opsForValue().get(key);
            } else {
                return Mono.empty();
            }
        });
    }

    /**
     * Expect to use this method when you want to delete all the sessions in this Appsmith instance.
     * This would be required for whenever any attribute related to sessions becomes invalid at a systemic level.
     * Use with caution, every user will be logged out.
     */
    public Mono<Void> deleteAllSessionsIncludingCurrentUser() {
        AtomicInteger deletedKeysCount = new AtomicInteger(0);

        return redisOperations
                .execute(connection -> {
                    Flux<ByteBuffer> scanFlux = connection
                            .keyCommands()
                            .scan(ScanOptions.scanOptions()
                                    .match(SPRING_SESSION_PATTERN)
                                    .count(1000)
                                    .build());

                    return scanFlux.flatMap(scannedKey -> {
                                return connection.keyCommands().del(scannedKey).doOnSuccess(result -> {
                                    int count = deletedKeysCount.incrementAndGet();
                                    if (count % 10000 == 0) {
                                        log.info("Processed {} Redis keys", count);
                                    }
                                });
                            })
                            .then()
                            .doOnSuccess(v -> log.info("Total Redis keys processed: {}", deletedKeysCount.get()))
                            .doOnError(error -> log.error("Redis key deletion error: {}", error.getMessage()));
                })
                .then();
    }
}
