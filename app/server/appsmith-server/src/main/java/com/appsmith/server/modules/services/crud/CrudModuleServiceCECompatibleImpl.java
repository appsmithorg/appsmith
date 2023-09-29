package com.appsmith.server.modules.services.crud;

import com.appsmith.server.modules.services.base.BaseModuleServiceImpl;
import com.appsmith.server.repositories.ModuleRepository;
import org.springframework.stereotype.Service;

@Service
public class CrudModuleServiceCECompatibleImpl extends BaseModuleServiceImpl implements CrudModuleServiceCECompatible {
    public CrudModuleServiceCECompatibleImpl(ModuleRepository moduleRepository) {
        super(moduleRepository);
    }
}
