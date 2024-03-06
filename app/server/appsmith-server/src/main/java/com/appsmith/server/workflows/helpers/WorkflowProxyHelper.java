package com.appsmith.server.workflows.helpers;

import com.appsmith.server.dtos.ApprovalRequestResolutionProxyDTO;
import com.appsmith.server.dtos.WorkflowTriggerProxyDTO;
import org.springframework.http.HttpHeaders;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface WorkflowProxyHelper {
    Mono<Map<String, Object>> updateApprovalRequestResolutionOnProxy(
            ApprovalRequestResolutionProxyDTO approvalRequestResolutionProxyDTO);

    Mono<Map<String, Object>> triggerWorkflowOnProxy(
            WorkflowTriggerProxyDTO workflowTriggerProxyDTO, HttpHeaders httpHeaders);

    Mono<Map<String, Object>> getWorkflowRunActivities(String workflowId, String runId);

    Mono<Map<String, Object>> getWorkflowRuns(String workflowId, MultiValueMap<String, String> queryParams);
}
