package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Module;
import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.NewActionService;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.scheduler.Scheduler;

public class ModuleServiceCEImpl extends BaseService<ModuleRepository, Module, String> implements ModuleServiceCE {

    private final ModuleRepository moduleRepository;
    private final NewActionService newActionService;
    private final TransactionalOperator transactionalOperator;

    public ModuleServiceCEImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            ModuleRepository repository,
            AnalyticsService analyticsService,
            NewActionService newActionService,
            TransactionalOperator transactionalOperator) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.moduleRepository = repository;
        this.newActionService = newActionService;
        this.transactionalOperator = transactionalOperator;
    }
}
