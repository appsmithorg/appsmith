package com.appsmith.server.workflows.helper;

import org.json.JSONObject;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

public interface WorkflowProxyHelper {
    Mono<JSONObject> getWorkflowHistoryFromProxySource(MultiValueMap<String, String> filters);
}
