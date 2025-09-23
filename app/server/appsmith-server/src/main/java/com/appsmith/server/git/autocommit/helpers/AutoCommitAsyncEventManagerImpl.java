package com.appsmith.server.git.autocommit.helpers;

import com.appsmith.server.events.AutoCommitEvent;
import com.appsmith.server.git.autocommit.AutoCommitSolution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import reactor.core.scheduler.Schedulers;

@Component
@Slf4j
@RequiredArgsConstructor
public class AutoCommitAsyncEventManagerImpl implements AutoCommitAsyncEventManager {

    private final ApplicationEventPublisher applicationEventPublisher;
    private final AutoCommitSolution autoCommitSolution;

    @Override
    public void publishAsyncEvent(AutoCommitEvent autoCommitEvent) {
        log.info("published event for auto commit: {}", autoCommitEvent);
        applicationEventPublisher.publishEvent(autoCommitEvent);
    }

    @Async
    @EventListener
    @Override
    public void autoCommitPublishEventListener(AutoCommitEvent event) {
        log.info("received event for auto commit: {}", event);
        String baseArtifactId = event.getApplicationId();
        String authorName = event.getAuthorName();
        String authorEmail = event.getAuthorEmail();

        autoCommitSolution
                .startApplicationAutoCommit(baseArtifactId, authorName, authorEmail, event)
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        result -> log.info(
                                "Auto-commit completed successfully for application: {}", event.getApplicationId()),
                        error -> log.error(
                                "Error during auto-commit for application: {}", event.getApplicationId(), error));
    }
}
