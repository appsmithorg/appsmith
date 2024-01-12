package com.appsmith.server.workflows.interact;

import com.appsmith.server.dtos.ApprovalRequestResolutionDTO;
import com.fasterxml.jackson.databind.JsonNode;
import reactor.core.publisher.Mono;

public interface InteractApprovalRequestServiceCECompatible {
    Mono<JsonNode> resolveApprovalRequest(ApprovalRequestResolutionDTO approvalRequestResolutionDTO);
}
