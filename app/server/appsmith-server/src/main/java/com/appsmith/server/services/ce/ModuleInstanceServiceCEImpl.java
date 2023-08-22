package com.appsmith.server.services.ce;

import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.ModuleService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.PackageService;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.scheduler.Scheduler;

public class ModuleInstanceServiceCEImpl extends BaseService<ModuleInstanceRepository, ModuleInstance, String>
        implements ModuleInstanceServiceCE {

    private final ModuleInstanceRepository moduleInstanceRepository;
    private final ModuleService moduleService;
    private final PackageService packageService;
    private final NewActionService newActionService;

    public ModuleInstanceServiceCEImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            ModuleInstanceRepository repository,
            AnalyticsService analyticsService,
            ModuleInstanceRepository moduleInstanceRepository,
            ModuleService moduleService,
            PackageService packageService,
            NewActionService newActionService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.moduleInstanceRepository = moduleInstanceRepository;
        this.moduleService = moduleService;
        this.packageService = packageService;
        this.newActionService = newActionService;
    }
}
