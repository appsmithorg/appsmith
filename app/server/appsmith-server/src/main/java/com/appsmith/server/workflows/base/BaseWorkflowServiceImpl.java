package com.appsmith.server.workflows.base;

import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.AnalyticsService;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.scheduler.Scheduler;

public abstract class BaseWorkflowServiceImpl extends BaseWorkflowServiceCECompatibleImpl
        implements BaseWorkflowService {
    public BaseWorkflowServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            WorkflowRepository repository,
            AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }
}
