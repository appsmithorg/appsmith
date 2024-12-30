package com.appsmith.server.git;

import com.appsmith.external.git.constants.GitSpan;
import com.appsmith.server.constants.ArtifactType;
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

    /**
     * Adds a baseArtifact id as a key in redis, the presence of this key represents a symbolic lock, essentially meaning that no new operations
     * should be performed till this key remains present.
     *
     * @param key            : base id of the artifact for which the key is getting added.
     * @param commandName    : Name of the operation which is trying to acquire the lock, this value will be added against the key
     * @param isRetryAllowed : Boolean for whether retries for adding the value is allowed
     * @return a boolean publisher for the added file locks
     */
    public Mono<Boolean> addFileLock(String key, String commandName, Boolean isRetryAllowed) {
        long numberOfRetries = Boolean.TRUE.equals(isRetryAllowed) ? MAX_RETRIES : 0L;

        log.info("Git command {} is trying to acquire the lock for identity {}", commandName, key);
        return redisUtils
                .addFileLock(key, commandName)
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

    public Mono<Boolean> addFileLock(String baseArtifactId, String commandName) {
        String key = ArtifactType.APPLICATION.lowerCaseName() + "-" + baseArtifactId;
        return addFileLock(key, commandName, true);
    }

    public Mono<Boolean> releaseFileLock(String baseArtifactId) {
        String key = ArtifactType.APPLICATION.lowerCaseName() + "-" + baseArtifactId;

        return redisUtils
                .releaseFileLock(key)
                .name(GitSpan.RELEASE_FILE_LOCK)
                .tap(Micrometer.observation(observationRegistry));
    }

    /**
     * This is a wrapper method for acquiring git lock, since multiple ops are used in sequence
     * for a complete composite operation not all ops require to acquire the lock hence a dummy flag is sent back for
     * operations in that is getting executed in between
     *
     * @param artifactType
     * @param baseArtifactId : id of the base artifact for which ops would be locked
     * @param isLockRequired : is lock really required or is it a proxy function
     * @return : Boolean for whether the lock is acquired
     */
    public Mono<Boolean> acquireGitLock(
            ArtifactType artifactType, String baseArtifactId, String commandName, Boolean isLockRequired) {
        if (!Boolean.TRUE.equals(isLockRequired)) {
            return Mono.just(Boolean.TRUE);
        }

        String key = artifactType.lowerCaseName() + "-" + baseArtifactId;

        return addFileLock(key, commandName, true);
    }

    /**
     * This is a wrapper method for releasing git lock, since multiple ops are used in sequence
     * for a complete composite operation not all ops require to acquire the lock hence a dummy flag is sent back for
     * operations in that is getting executed in between
     *
     * @param artifactType
     * @param baseArtifactId : id of the base artifact for which ops would be locked
     * @param isLockRequired : is lock really required or is it a proxy function
     * @return : Boolean for whether the lock is released
     */
    public Mono<Boolean> releaseFileLock(ArtifactType artifactType, String baseArtifactId, boolean isLockRequired) {
        if (!Boolean.TRUE.equals(isLockRequired)) {
            return Mono.just(Boolean.TRUE);
        }

        String key = artifactType.lowerCaseName() + "-" + baseArtifactId;

        return redisUtils
                .releaseFileLock(key)
                .name(GitSpan.RELEASE_FILE_LOCK)
                .tap(Micrometer.observation(observationRegistry));
    }
}
