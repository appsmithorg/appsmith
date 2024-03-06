package com.appsmith.server.moduleinstantiation;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.dtos.ModuleInstantiatingMetaDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ModuleInstantiatingService<T, U extends BaseDomain> {
    Mono<Void> instantiateEntities(ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO);

    Mono<List<U>> generateInstantiatedEntities(ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO);
}
