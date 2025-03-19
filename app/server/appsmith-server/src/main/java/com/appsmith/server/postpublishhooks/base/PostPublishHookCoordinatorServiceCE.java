package com.appsmith.server.postpublishhooks.base;

import reactor.core.publisher.Mono;

/**
 * Interface defining operations for coordinating post-publish hooks across different entity types.
 */
public interface PostPublishHookCoordinatorServiceCE<T> {

    /**
     * Executes all post-publish hooks for all entity types in an artifact.
     *
     * @param artifactId The ID of the artifact that was published
     * @return Void Mono when all hooks have been executed
     */
    Mono<Void> executePostPublishHooks(String artifactId);
}
