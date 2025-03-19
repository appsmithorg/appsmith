package com.appsmith.server.postpublishhooks.base;

import reactor.core.publisher.Mono;

/**
 * Interface defining the post-publish hook capability.
 * This is implemented by services that need to perform operations after an artifact is published.
 *
 * @param <T> The entity type that this hook operates on
 */
public interface PostPublishHookableCE<ARTEFACT, ENTITY> {

    /**
     * Executes post-publish operations for all entities of a specific type in an artifact.
     *
     * @param artifactId The artifact ID
     * @return Void Mono when processing is complete
     */
    default Mono<Void> postPublishHookForArtifactEntities(String artifactId) {
        return Mono.empty();
    }

    /**
     * Returns the entity class type this service handles.
     *
     * @return The class of the entity type
     */
    Class<ENTITY> getEntityType();

    /**
     * Returns the artifact class type this service handles.
     *
     * @return The class of the artifact type
     */
    Class<ARTEFACT> getArtifactType();
}
