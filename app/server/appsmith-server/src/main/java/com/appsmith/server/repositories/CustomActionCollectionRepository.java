package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCE;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Optional;

public interface CustomActionCollectionRepository extends CustomActionCollectionRepositoryCE {
    Flux<ActionCollection> findAllByModuleIds(List<String> moduleIds, Optional<AclPermission> permission);

    Flux<ActionCollection> findAllByRootModuleInstanceIds(
            List<String> moduleInstanceIds, Optional<AclPermission> permission);

    Flux<ActionCollection> findByWorkflowId(
            String workflowId, Optional<AclPermission> aclPermission, Optional<List<String>> includeFields);

    Flux<ActionCollection> findByWorkflowIds(
            List<String> workflowIds, Optional<AclPermission> aclPermission, Optional<List<String>> includeFields);
}
