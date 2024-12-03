package com.appsmith.server.git;

import com.appsmith.external.git.constants.GitSpan;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.RedisUtils;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import static com.appsmith.server.helpers.GitUtils.MAX_RETRIES;
import static com.appsmith.server.helpers.GitUtils.RETRY_DELAY;

@Slf4j
@Component
@RequiredArgsConstructor
public class GitRedisUtils {

    private final RedisUtils redisUtils;
    private final ObservationRegistry observationRegistry;

    public Mono<Boolean> addFileLock(String defaultApplicationId, String commandName, Boolean isRetryAllowed) {
        long numberOfRetries = Boolean.TRUE.equals(isRetryAllowed) ? MAX_RETRIES : 0L;

        log.info(
                "Git command {} is trying to acquire the lock for application id {}",
                commandName,
                defaultApplicationId);
        return redisUtils
                .addFileLock(defaultApplicationId, commandName)
                .retryWhen(Retry.fixedDelay(numberOfRetries, RETRY_DELAY)
                        .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) -> {
                            if (retrySignal.failure() instanceof AppsmithException) {
                                throw (AppsmithException) retrySignal.failure();
                            }

                            throw new AppsmithException(AppsmithError.GIT_FILE_IN_USE, commandName);
                        }))
                .name(GitSpan.ADD_FILE_LOCK)
                .tap(Micrometer.observation(observationRegistry));
    }

    public Mono<Boolean> addFileLock(String defaultApplicationId, String commandName) {
        return addFileLock(defaultApplicationId, commandName, true);
    }

    public Mono<Boolean> releaseFileLock(String defaultApplicationId) {
        return redisUtils
                .releaseFileLock(defaultApplicationId)
                .name(GitSpan.RELEASE_FILE_LOCK)
                .tap(Micrometer.observation(observationRegistry));
    }

    public Mono<Boolean> acquireGitLock(String baseArtifactId, String commandName, boolean isLockRequired) {
        if (!Boolean.TRUE.equals(isLockRequired)) {
            return Mono.just(Boolean.TRUE);
        }

        return addFileLock(baseArtifactId, commandName);
    }

    public Mono<Boolean> releaseFileLock(String baseArtifactId, boolean isLockRequired) {
        if (!Boolean.TRUE.equals(isLockRequired)) {
            return Mono.just(Boolean.TRUE);
        }

        return releaseFileLock(baseArtifactId);
    }
}
