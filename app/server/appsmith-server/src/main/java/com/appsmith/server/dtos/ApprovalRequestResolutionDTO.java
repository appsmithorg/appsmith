package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ApprovalRequestResolutionDTO {
    String workflowId;
    String requestId;
    String resolution;
    String resolutionReason;
    Map<String, Object> resolutionMetadata;
}
