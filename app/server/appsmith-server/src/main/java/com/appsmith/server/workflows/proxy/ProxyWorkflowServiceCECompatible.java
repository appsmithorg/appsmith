package com.appsmith.server.workflows.proxy;

import org.json.JSONObject;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

public interface ProxyWorkflowServiceCECompatible {
    Mono<JSONObject> getWorkflowHistory(MultiValueMap<String, String> filters);

    Mono<JSONObject> getWorkflowHistoryByWorkflowId(String id, MultiValueMap<String, String> filters);
}
