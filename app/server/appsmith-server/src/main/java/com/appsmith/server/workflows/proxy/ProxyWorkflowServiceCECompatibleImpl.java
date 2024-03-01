package com.appsmith.server.workflows.proxy;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.workflows.base.BaseWorkflowServiceCECompatibleImpl;
import jakarta.validation.Validator;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
public class ProxyWorkflowServiceCECompatibleImpl extends BaseWorkflowServiceCECompatibleImpl
        implements ProxyWorkflowServiceCECompatible {
    public ProxyWorkflowServiceCECompatibleImpl(
            Validator validator, WorkflowRepository repository, AnalyticsService analyticsService) {
        super(validator, repository, analyticsService);
    }

    @Override
    public Mono<Map<String, Object>> getWorkflowRunActivities(String workflowId, String runId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Map<String, Object>> getWorkflowRuns(String workflowId, MultiValueMap<String, String> queryParams) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
