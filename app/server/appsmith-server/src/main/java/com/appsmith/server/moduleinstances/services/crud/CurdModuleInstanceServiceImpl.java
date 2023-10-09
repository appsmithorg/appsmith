package com.appsmith.server.moduleinstances.services.crud;

import com.appsmith.server.moduleinstances.services.base.BaseModuleInstanceServiceImpl;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import org.springframework.stereotype.Service;

@Service
public class CurdModuleInstanceServiceImpl extends BaseModuleInstanceServiceImpl implements CrudModuleInstanceService {

    private final ModuleInstanceRepository moduleInstanceRepository;

    public CurdModuleInstanceServiceImpl(ModuleInstanceRepository moduleInstanceRepository) {
        super(moduleInstanceRepository);
        this.moduleInstanceRepository = moduleInstanceRepository;
    }
}
