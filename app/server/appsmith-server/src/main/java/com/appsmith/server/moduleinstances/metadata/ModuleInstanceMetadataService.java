package com.appsmith.server.moduleinstances.metadata;

import reactor.core.publisher.Mono;

public interface ModuleInstanceMetadataService {
    Mono<Long> getModuleInstanceCountByApplicationId(String applicationId);
}
