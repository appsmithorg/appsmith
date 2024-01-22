package com.appsmith.server.workflows.interact;

import com.appsmith.server.domains.Workflow;
import com.appsmith.server.workflows.base.BaseWorkflowServiceCECompatible;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpHeaders;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

public interface InteractWorkflowServiceCECompatible extends BaseWorkflowServiceCECompatible {
    Mono<String> generateBearerTokenForWebhook(String workflowId);

    Mono<Boolean> archiveBearerTokenForWebhook(String workflowId);

    Mono<Workflow> publishWorkflow(String workflowId);

    Mono<JsonNode> triggerWorkflow(
            String workflowId, MultiValueMap<String, String> queryParams, HttpHeaders headers, JsonNode triggerData);
}
