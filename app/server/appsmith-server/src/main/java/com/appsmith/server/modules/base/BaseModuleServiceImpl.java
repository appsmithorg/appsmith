package com.appsmith.server.modules.base;

import com.appsmith.server.repositories.ModuleRepository;

public abstract class BaseModuleServiceImpl extends BaseModuleServiceCECompatibleImpl implements BaseModuleService {

    private final ModuleRepository moduleRepository;

    public BaseModuleServiceImpl(ModuleRepository moduleRepository) {
        this.moduleRepository = moduleRepository;
    }
}
