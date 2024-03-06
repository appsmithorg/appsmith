package com.appsmith.server.workflows.interact;

import com.appsmith.server.domains.Workflow;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.workflows.base.BaseWorkflowServiceImpl;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Validator;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
public class InteractWorkflowServiceCECompatibleImpl extends BaseWorkflowServiceImpl
        implements InteractWorkflowServiceCECompatible {
    public InteractWorkflowServiceCECompatibleImpl(
            Validator validator, WorkflowRepository repository, AnalyticsService analyticsService) {
        super(validator, repository, analyticsService);
    }

    @Override
    public Mono<String> generateBearerTokenForWebhook(String workflowId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Boolean> archiveBearerTokenForWebhook(String workflowId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Workflow> publishWorkflow(String workflowId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Map<String, Object>> triggerWorkflow(
            String workflowId, MultiValueMap<String, String> queryParams, HttpHeaders headers, JsonNode triggerData) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
