package com.external.plugins.dtos;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;

@Data
public class ResolveApprovalRequestWorkflowCommandDTO extends WorkflowCommandDTO {
    String workflowId;
    String requestId;
    String resolution;
    String resolutionReason;
    JsonNode resolutionMetadata;
}
