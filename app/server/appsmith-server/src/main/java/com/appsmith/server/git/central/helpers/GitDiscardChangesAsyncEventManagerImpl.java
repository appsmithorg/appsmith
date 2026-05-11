package com.appsmith.server.git.central.helpers;

import com.appsmith.server.annotations.GitRoute;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.events.GitDiscardChangesEvent;
import com.appsmith.server.git.central.CentralGitService;
import com.appsmith.server.git.central.GitType;
import com.appsmith.server.git.constants.GitRouteOperation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Component
@Slf4j
@RequiredArgsConstructor
public class GitDiscardChangesAsyncEventManagerImpl implements GitDiscardChangesAsyncEventManager {

    private final ApplicationEventPublisher applicationEventPublisher;
    private final ObjectProvider<CentralGitService> centralGitServiceProvider;
    private final ObjectProvider<GitDiscardChangesAsyncEventManager> gitDiscardChangesAsyncEventManagerProvider;

    @Override
    public void publishAsyncEvent(GitDiscardChangesEvent event) {
        log.info("published event for git discard changes: {}", event);
        applicationEventPublisher.publishEvent(event);
    }

    @Async
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
                        event.getIsValidateAndPublish())
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
            Boolean isValidateAndPublish) {
        return centralGitServiceProvider
                .getObject()
                .discardChanges(branchedArtifactId, artifactType, gitType, isValidateAndPublish);
    }
}
