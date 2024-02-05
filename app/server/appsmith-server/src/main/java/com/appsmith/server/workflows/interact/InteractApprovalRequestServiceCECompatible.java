package com.appsmith.server.workflows.interact;

import com.appsmith.server.dtos.ApprovalRequestResolutionDTO;
import com.appsmith.server.dtos.ApprovalRequestResolvedResponseDTO;
import reactor.core.publisher.Mono;

public interface InteractApprovalRequestServiceCECompatible {
    Mono<ApprovalRequestResolvedResponseDTO> resolveApprovalRequest(
            ApprovalRequestResolutionDTO approvalRequestResolutionDTO);
}
