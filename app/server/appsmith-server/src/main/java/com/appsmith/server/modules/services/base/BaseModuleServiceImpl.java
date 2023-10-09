package com.appsmith.server.modules.services.base;

import com.appsmith.server.repositories.ModuleRepository;
import org.springframework.stereotype.Service;

@Service
public abstract class BaseModuleServiceImpl implements BaseModuleService {

    private final ModuleRepository moduleRepository;

    public BaseModuleServiceImpl(ModuleRepository moduleRepository) {
        this.moduleRepository = moduleRepository;
    }
}
