package com.appsmith.server.fork.forkable;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.ForkingMetaDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * This interface marks a domain as an entity that can be forked.
 * As soon as a domain becomes forkable, it is supposed to manage all aspects of what a forked entity if this type will look like.
 */
public interface ForkableServiceCE<T extends BaseDomain> {

    Flux<T> getExistingEntitiesInTarget(String targetWorkspaceId);

    <U extends BaseDomain> Flux<T> getForkableEntitiesFromSource(
            ForkingMetaDTO sourceMeta, Flux<U> dependentEntityFlux);

    /**
     * This method defines the behaviour of an object when the application is forked from one workspace to another.
     * If you wish to fork this object with all properties intact, do the following.
     * Create a new object from the source object
     * Based on forkWithConfiguration field present in source app, add logic for copying the object to target workspace
     * Please bear in mind that forking might give people outside your workspace access to this object
     *
     * @param originalEntity : The original document from the source workspace that needs to be forked
     * @return
     */
    Mono<T> createForkedEntity(
            T originalEntity, ForkingMetaDTO sourceMeta, ForkingMetaDTO targetMeta, Mono<List<T>> existingEntities);

    T initializeFork(T originalEntity, ForkingMetaDTO targetMeta);
}
