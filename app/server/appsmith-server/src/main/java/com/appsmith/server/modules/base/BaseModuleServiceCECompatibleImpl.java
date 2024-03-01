package com.appsmith.server.modules.base;

import com.appsmith.server.domains.Module;
import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import jakarta.validation.Validator;

public class BaseModuleServiceCECompatibleImpl extends BaseService<ModuleRepository, Module, String>
        implements BaseModuleServiceCECompatible {
    public BaseModuleServiceCECompatibleImpl(
            Validator validator, ModuleRepository repository, AnalyticsService analyticsService) {
        super(validator, repository, analyticsService);
    }
}
