package com.external.plugins.dtos;

import lombok.Data;

import java.util.Map;

@Data
public class ResolveApprovalRequestWorkflowCommandDTO extends WorkflowCommandDTO {
    String workflowId;
    String requestId;
    String resolution;
    Map<String, Object> resolutionMetadata;
}
