package com.appsmith.server.workflows.proxy;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.workflows.base.BaseWorkflowServiceCECompatibleImpl;
import jakarta.validation.Validator;
import org.json.JSONObject;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

@Service
public class ProxyWorkflowServiceCECompatibleImpl extends BaseWorkflowServiceCECompatibleImpl
        implements ProxyWorkflowServiceCECompatible {
    public ProxyWorkflowServiceCECompatibleImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            WorkflowRepository repository,
            AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }

    @Override
    public Mono<JSONObject> getWorkflowHistory(MultiValueMap<String, String> filters) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<JSONObject> getWorkflowHistoryByWorkflowId(String id, MultiValueMap<String, String> filters) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
