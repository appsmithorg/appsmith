package com.appsmith.server.repositories;

import com.appsmith.server.domains.ModuleInstance;
import reactor.core.publisher.Mono;

public interface CustomModuleInstanceRepository extends AppsmithRepository<ModuleInstance> {
    Mono<Long> getModuleInstanceCountByModuleId(String moduleId);
}
