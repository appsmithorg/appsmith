package com.appsmith.server.workflows.base;

import com.appsmith.server.domains.Workflow;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.scheduler.Scheduler;

public class BaseWorkflowServiceCECompatibleImpl extends BaseService<WorkflowRepository, Workflow, String>
        implements BaseWorkflowServiceCECompatible {
    public BaseWorkflowServiceCECompatibleImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            WorkflowRepository repository,
            AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }
}
