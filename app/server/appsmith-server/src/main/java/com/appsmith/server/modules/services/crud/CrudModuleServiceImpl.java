package com.appsmith.server.modules.services.crud;

import com.appsmith.server.modules.services.base.BaseModuleServiceImpl;
import com.appsmith.server.repositories.ModuleRepository;
import org.springframework.stereotype.Service;

@Service
public class CrudModuleServiceImpl extends BaseModuleServiceImpl implements CrudModuleService {
    private final ModuleRepository moduleRepository;

    public CrudModuleServiceImpl(ModuleRepository moduleRepository) {
        super(moduleRepository);
        this.moduleRepository = moduleRepository;
    }
}
