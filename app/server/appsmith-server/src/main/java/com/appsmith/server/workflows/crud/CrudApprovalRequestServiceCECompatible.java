package com.appsmith.server.workflows.crud;

import com.appsmith.server.domains.ApprovalRequest;
import com.appsmith.server.dtos.ApprovalRequestCreationDTO;
import com.appsmith.server.dtos.PagedDomain;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

public interface CrudApprovalRequestServiceCECompatible {
    Mono<ApprovalRequest> createApprovalRequest(ApprovalRequestCreationDTO approvalRequestCreationDTO);

    Mono<ApprovalRequest> getApprovalRequestById(String id);

    Mono<PagedDomain<ApprovalRequest>> getPaginatedApprovalRequests(MultiValueMap<String, String> filters);
}
