package com.appsmith.server.git;

import com.appsmith.server.constants.ArtifactType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Deprecated
public class GitRedisUtils {

    @Deprecated
    public Mono<Boolean> addFileLock(String baseArtifactId, String commandName) {
        return Mono.just(true);
    }

    @Deprecated
    public Mono<Boolean> releaseFileLock(String baseArtifactId) {
        return Mono.just(true);
    }

    @Deprecated
    public Mono<Boolean> releaseFileLock(ArtifactType artifactType, String baseArtifactId, boolean isLockRequired) {
        return Mono.just(true);
    }

    @Deprecated
    public Mono<Boolean> acquireGitLock(
            ArtifactType artifactType, String baseArtifactId, String commandName, boolean isLockRequired) {
        return Mono.just(true);
    }
}
