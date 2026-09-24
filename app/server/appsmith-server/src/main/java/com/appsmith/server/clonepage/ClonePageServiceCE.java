package com.appsmith.server.clonepage;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.ClonePageMetaDTO;
import reactor.core.publisher.Mono;

public interface ClonePageServiceCE<T extends BaseDomain> {
    /**
     * Upper bound on entities cloned concurrently by one cloner. Each in-flight create retains its own copies of
     * the entity and issues several queries, so the fan-out is bounded instead of using Reactor's default of 256.
     */
    int CLONE_CONCURRENCY = 16;

    Mono<Void> cloneEntities(ClonePageMetaDTO clonePageMetaDTO);
}
