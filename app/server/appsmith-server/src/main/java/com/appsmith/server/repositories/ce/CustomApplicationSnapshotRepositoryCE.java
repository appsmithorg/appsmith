package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Mono;

public interface CustomApplicationSnapshotRepositoryCE extends AppsmithRepository<ApplicationSnapshot> {
    Mono<ApplicationSnapshot> findByApplicationIdAndBranchName(String applicationId, String branchName, AclPermission permission);
}
