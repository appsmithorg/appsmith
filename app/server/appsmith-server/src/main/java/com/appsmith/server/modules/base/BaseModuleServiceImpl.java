package com.appsmith.server.modules.base;

import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.services.AnalyticsService;
import jakarta.validation.Validator;

public abstract class BaseModuleServiceImpl extends BaseModuleServiceCECompatibleImpl implements BaseModuleService {

    public BaseModuleServiceImpl(Validator validator, ModuleRepository repository, AnalyticsService analyticsService) {
        super(validator, repository, analyticsService);
    }
}
