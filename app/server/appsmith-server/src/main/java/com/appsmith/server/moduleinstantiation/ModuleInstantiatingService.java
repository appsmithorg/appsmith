package com.appsmith.server.moduleinstantiation;

import com.appsmith.server.dtos.ModuleInstantiatingMetaDTO;
import reactor.core.publisher.Mono;

public interface ModuleInstantiatingService<T> {
    Mono<Void> instantiateEntities(ModuleInstantiatingMetaDTO moduleInstantiatingMetaDTO);
}
