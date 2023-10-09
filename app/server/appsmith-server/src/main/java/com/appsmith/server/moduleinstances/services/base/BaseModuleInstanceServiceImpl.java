package com.appsmith.server.moduleinstances.services.base;

import com.appsmith.server.repositories.ModuleInstanceRepository;
import org.springframework.stereotype.Service;

@Service
public abstract class BaseModuleInstanceServiceImpl implements BaseModuleInstanceService {

    private final ModuleInstanceRepository moduleInstanceRepository;

    public BaseModuleInstanceServiceImpl(ModuleInstanceRepository moduleInstanceRepository) {
        this.moduleInstanceRepository = moduleInstanceRepository;
    }
}
