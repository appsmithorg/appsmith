package com.appsmith.server.postpublishhooks;

import com.appsmith.server.domains.Application;
import com.appsmith.server.postpublishhooks.base.PostPublishHookCoordinatorServiceCE;
import com.appsmith.server.postpublishhooks.base.PostPublishHookable;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Service responsible for coordinating post-publish hooks for different entity types.
 * This service delegates to the appropriate specialized services based on entity type.
 */
@Slf4j
public class ApplicationPostPublishHookCoordinatorServiceCEImpl
        implements PostPublishHookCoordinatorServiceCE<Application> {

    protected final List<PostPublishHookable<Application, ?>> postPublishHookables;

    public ApplicationPostPublishHookCoordinatorServiceCEImpl(
            List<PostPublishHookable<Application, ?>> postPublishHookables) {
        this.postPublishHookables = postPublishHookables;
    }

    /**
     * Executes all post-publish hooks for all entity types in an application.
     * This is done asynchronously to not block the publish operation.
     *
     * @param applicationId The ID of the application that was published
     * @return Void Mono when all hooks have been executed
     */
    @Override
    public void executePostPublishHooks(String applicationId) {
        log.debug("Executing post-publish hooks for application: {}", applicationId);

        Flux.fromIterable(postPublishHookables)
                .flatMap(hookable -> {
                    log.debug(
                            "Executing post-publish hook for entity type: {}",
                            hookable.getEntityType().getSimpleName());
                    return hookable.postPublishHookForArtifactEntities(applicationId)
                            .onErrorResume(error -> {
                                log.error(
                                        "Error executing post-publish hook for entity type {}: {}",
                                        hookable.getEntityType().getSimpleName(),
                                        error.getMessage());
                                return Mono.empty();
                            });
                })
                .then()
                .subscribe();
    }
}
