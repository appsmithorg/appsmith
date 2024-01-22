package com.appsmith.server.dtos;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ApprovalRequestResolutionDTO {
    String workflowId;
    String requestId;
    String resolution;
    String resolutionReason;
    JsonNode resolutionMetadata;
}
