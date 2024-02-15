package com.appsmith.server.workflows.proxy;

import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface ProxyWorkflowServiceCECompatible {

    Mono<Map<String, Object>> getWorkflowRunActivities(String workflowId, String runId);

    Mono<Map<String, Object>> getWorkflowRuns(String workflowId, MultiValueMap<String, String> queryParams);
}
