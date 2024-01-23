package com.appsmith.server.workflows.proxy;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

public interface ProxyWorkflowServiceCECompatible {

    Mono<JsonNode> getWorkflowRunActivities(String workflowId, String runId);

    Mono<JsonNode> getWorkflowRuns(String workflowId, MultiValueMap<String, String> queryParams);
}
