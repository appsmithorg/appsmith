package com.appsmith.server.workflows.helpers;

import com.appsmith.server.dtos.ApprovalRequestResolutionProxyDTO;
import com.appsmith.server.dtos.WorkflowTriggerProxyDTO;
import org.json.JSONObject;
import org.springframework.http.HttpHeaders;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

public interface WorkflowProxyHelper {
    Mono<JSONObject> getWorkflowHistoryFromProxySource(MultiValueMap<String, String> filters);

    Mono<JSONObject> updateApprovalRequestResolutionOnProxy(
            ApprovalRequestResolutionProxyDTO approvalRequestResolutionProxyDTO);

    Mono<JSONObject> triggerWorkflowOnProxy(WorkflowTriggerProxyDTO workflowTriggerProxyDTO, HttpHeaders httpHeaders);
}
