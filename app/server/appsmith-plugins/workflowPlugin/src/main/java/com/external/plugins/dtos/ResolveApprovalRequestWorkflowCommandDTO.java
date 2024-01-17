package com.external.plugins.dtos;

import lombok.Data;

@Data
public class ResolveApprovalRequestWorkflowCommandDTO extends WorkflowCommandDTO {
    String workflowId;
    String requestId;
    String resolution;
    String resolutionReason;
}
