package com.appsmith.server.services;

import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.services.ce.ModuleInstanceServiceCEImpl;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Service
public class ModuleInstanceServiceImpl extends ModuleInstanceServiceCEImpl implements ModuleInstanceService {

    public ModuleInstanceServiceImpl(
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
        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                moduleInstanceRepository,
                moduleService,
                packageService,
                newActionService);
    }
}
