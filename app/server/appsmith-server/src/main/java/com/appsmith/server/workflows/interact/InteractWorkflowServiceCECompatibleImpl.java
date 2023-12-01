package com.appsmith.server.workflows.interact;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.workflows.base.BaseWorkflowServiceImpl;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

@Service
public class InteractWorkflowServiceCECompatibleImpl extends BaseWorkflowServiceImpl
        implements InteractWorkflowServiceCECompatible {
    public InteractWorkflowServiceCECompatibleImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            WorkflowRepository repository,
            AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }

    @Override
    public Mono<String> generateBearerTokenForWebhook(String workflowId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Boolean> archiveBearerTokenForWebhook(String workflowId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
