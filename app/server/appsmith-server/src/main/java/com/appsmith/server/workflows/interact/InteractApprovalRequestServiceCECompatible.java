package com.appsmith.server.workflows.interact;

import com.appsmith.server.dtos.ApprovalRequestResolutionDTO;
import reactor.core.publisher.Mono;

public interface InteractApprovalRequestServiceCECompatible {
    Mono<Boolean> resolveApprovalRequest(ApprovalRequestResolutionDTO approvalRequestResolutionDTO);
}
