package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ApprovalRequest;
import com.appsmith.server.dtos.PagedDomain;
import org.springframework.data.domain.Sort;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.Optional;

public interface CustomApprovalRequestRepository extends AppsmithRepository<ApprovalRequest> {
    Mono<PagedDomain<ApprovalRequest>> getAllWithFilters(
            MultiValueMap<String, String> filters, Optional<AclPermission> aclPermission, Optional<Sort> sortWith);
}
