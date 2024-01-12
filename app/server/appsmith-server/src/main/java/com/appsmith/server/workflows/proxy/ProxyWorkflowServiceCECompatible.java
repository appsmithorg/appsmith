package com.appsmith.server.workflows.proxy;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

public interface ProxyWorkflowServiceCECompatible {
    Mono<JsonNode> getWorkflowHistory(MultiValueMap<String, String> filters);

    Mono<JsonNode> getWorkflowHistoryByWorkflowId(String id, MultiValueMap<String, String> filters);
}
