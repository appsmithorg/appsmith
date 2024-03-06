package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ApprovalRequestResolutionProxyDTO {
    String workflowId;
    String requestId;
    String resolution;
    String runId;
}
