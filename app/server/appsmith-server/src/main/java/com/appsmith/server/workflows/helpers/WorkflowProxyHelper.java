package com.appsmith.server.workflows.helpers;

import com.appsmith.server.dtos.ApprovalRequestResolutionProxyDTO;
import org.json.JSONObject;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

public interface WorkflowProxyHelper {
    Mono<JSONObject> getWorkflowHistoryFromProxySource(MultiValueMap<String, String> filters);

    Mono<JSONObject> updateApprovalRequestResolutionOnProxy(
            ApprovalRequestResolutionProxyDTO approvalRequestResolutionProxyDTO);
}
