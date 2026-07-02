package com.appsmith.server.git.central.helpers;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.events.GitDiscardChangesEvent;
import com.appsmith.server.git.central.GitType;
import reactor.core.publisher.Mono;

import java.time.Instant;

public interface GitDiscardChangesAsyncEventManager {

    void publishAsyncEvent(GitDiscardChangesEvent event);

    void discardChangesEventListener(GitDiscardChangesEvent event);

    Mono<? extends Artifact> discardChanges(
            String branchedArtifactId,
            String authorName,
            String authorEmail,
            ArtifactType artifactType,
            GitType gitType,
            Boolean isValidateAndPublish,
            Instant expectedUpdatedAt);
}
