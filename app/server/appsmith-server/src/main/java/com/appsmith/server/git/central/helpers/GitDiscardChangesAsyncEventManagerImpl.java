package com.appsmith.server.git.central.helpers;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.annotations.GitRoute;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.events.GitDiscardChangesEvent;
import com.appsmith.server.git.central.CentralGitService;
import com.appsmith.server.git.central.GitType;
import com.appsmith.server.git.constants.GitRouteOperation;
import com.appsmith.server.git.resolver.GitArtifactHelperResolver;
import com.appsmith.server.services.GitArtifactHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Instant;
import java.util.Objects;

@Component
@Slf4j
@RequiredArgsConstructor
public class GitDiscardChangesAsyncEventManagerImpl implements GitDiscardChangesAsyncEventManager {

    private final ApplicationEventPublisher applicationEventPublisher;
    private final ObjectProvider<CentralGitService> centralGitServiceProvider;
    private final ObjectProvider<GitDiscardChangesAsyncEventManager> gitDiscardChangesAsyncEventManagerProvider;
    private final GitArtifactHelperResolver gitArtifactHelperResolver;

    @Override
    public void publishAsyncEvent(GitDiscardChangesEvent event) {
        log.info("published event for git discard changes: {}", event);
        applicationEventPublisher.publishEvent(event);
    }

    @EventListener
    @Override
    public void discardChangesEventListener(GitDiscardChangesEvent event) {
        log.info("received event for git discard changes: {}", event);

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                event.getUser(), null, event.getUser().getAuthorities());

        gitDiscardChangesAsyncEventManagerProvider
                .getObject()
                .discardChanges(
                        event.getArtifactId(),
                        event.getAuthorName(),
                        event.getAuthorEmail(),
                        event.getArtifactType(),
                        event.getGitType(),
                        event.getIsValidateAndPublish(),
                        event.getExpectedUpdatedAt())
                .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication))
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        result -> log.info(
                                "Git discard changes completed successfully for artifact: {}", event.getArtifactId()),
                        error -> log.error(
                                "Error during git discard changes for artifact: {}", event.getArtifactId(), error));
    }

    @Override
    @GitRoute(
            artifactType = ArtifactType.APPLICATION,
            operation = GitRouteOperation.ASYNC_DISCARD,
            fieldName = "branchedArtifactId",
            authorName = "authorName",
            authorEmail = "authorEmail")
    public Mono<? extends Artifact> discardChanges(
            String branchedArtifactId,
            String authorName,
            String authorEmail,
            ArtifactType artifactType,
            GitType gitType,
            Boolean isValidateAndPublish,
            Instant expectedUpdatedAt) {
        GitArtifactHelper<?> gitArtifactHelper = gitArtifactHelperResolver.getArtifactHelper(artifactType);

        return gitArtifactHelper
                .getArtifactById(branchedArtifactId, gitArtifactHelper.getArtifactEditPermission())
                .flatMap(currentArtifact -> {
                    if (hasArtifactChanged(currentArtifact, expectedUpdatedAt)) {
                        log.info(
                                "Skipping async discardChanges for artifact {} because it changed after event publication",
                                branchedArtifactId);
                        return Mono.just(currentArtifact);
                    }

                    return centralGitServiceProvider
                            .getObject()
                            .discardChanges(branchedArtifactId, artifactType, gitType, isValidateAndPublish);
                });
    }

    private boolean hasArtifactChanged(Artifact artifact, Instant expectedUpdatedAt) {
        if (!(artifact instanceof BaseDomain baseDomain)) {
            return false;
        }

        return !Objects.equals(baseDomain.getUpdatedAt(), expectedUpdatedAt);
    }
}
