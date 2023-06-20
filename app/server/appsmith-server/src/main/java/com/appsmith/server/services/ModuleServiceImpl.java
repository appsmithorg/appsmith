package com.appsmith.server.services;

import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.services.ce.ModuleServiceCEImpl;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Service
public class ModuleServiceImpl extends ModuleServiceCEImpl implements ModuleService {

    public ModuleServiceImpl(Scheduler scheduler, Validator validator, MongoConverter mongoConverter, ReactiveMongoTemplate reactiveMongoTemplate, ModuleRepository repository, AnalyticsService analyticsService, NewActionService newActionService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService, newActionService);
    }
}