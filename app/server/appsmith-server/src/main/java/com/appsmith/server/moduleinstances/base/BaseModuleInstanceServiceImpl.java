package com.appsmith.server.moduleinstances.base;

import com.appsmith.server.repositories.ModuleInstanceRepository;

public abstract class BaseModuleInstanceServiceImpl implements BaseModuleInstanceService {

    private final ModuleInstanceRepository moduleInstanceRepository;

    public BaseModuleInstanceServiceImpl(ModuleInstanceRepository moduleInstanceRepository) {
        this.moduleInstanceRepository = moduleInstanceRepository;
    }
}
