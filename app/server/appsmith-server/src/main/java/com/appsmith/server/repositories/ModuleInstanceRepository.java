package com.appsmith.server.repositories;

import com.appsmith.server.domains.ModuleInstance;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface ModuleInstanceRepository
        extends BaseRepository<ModuleInstance, String>, CustomModuleInstanceRepository {
    Flux<ModuleInstance> findByApplicationId(String applicationId);
}
