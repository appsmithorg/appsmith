package com.appsmith.server.workflows.interact;

import com.appsmith.server.dtos.ApprovalRequestResolutionDTO;
import org.json.JSONObject;
import reactor.core.publisher.Mono;

public interface InteractApprovalRequestServiceCECompatible {
    Mono<JSONObject> resolveApprovalRequest(ApprovalRequestResolutionDTO approvalRequestResolutionDTO);
}
