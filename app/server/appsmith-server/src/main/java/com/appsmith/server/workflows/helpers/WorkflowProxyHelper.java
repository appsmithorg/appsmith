package com.appsmith.server.workflows.helpers;

import com.appsmith.server.dtos.ApprovalRequestResolutionProxyDTO;
import com.appsmith.server.dtos.WorkflowTriggerProxyDTO;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpHeaders;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

public interface WorkflowProxyHelper {
    Mono<JsonNode> updateApprovalRequestResolutionOnProxy(
            ApprovalRequestResolutionProxyDTO approvalRequestResolutionProxyDTO);

    Mono<JsonNode> triggerWorkflowOnProxy(WorkflowTriggerProxyDTO workflowTriggerProxyDTO, HttpHeaders httpHeaders);

    Mono<JsonNode> getWorkflowRunActivities(String workflowId, String runId);

    Mono<JsonNode> getWorkflowRuns(String workflowId, MultiValueMap<String, String> queryParams);
}
