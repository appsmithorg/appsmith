package com.appsmith.server.repositories;

import com.appsmith.server.domains.ModuleInstance;
import org.springframework.stereotype.Repository;

@Repository
public interface ModuleInstanceRepository
        extends BaseRepository<ModuleInstance, String>, CustomModuleInstanceRepository {}
