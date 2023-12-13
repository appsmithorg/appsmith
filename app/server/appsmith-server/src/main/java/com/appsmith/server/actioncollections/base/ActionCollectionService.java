package com.appsmith.server.actioncollections.base;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.ActionCollectionDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

public interface ActionCollectionService extends ActionCollectionServiceCE {
    Mono<List<ActionCollection>> archiveActionCollectionsByModuleId(String moduleId);

    Mono<List<ActionCollectionDTO>> archiveActionCollectionsByRootModuleInstanceId(String rootModuleInstanceId);

    Flux<ActionCollection> findAllUnpublishedComposedActionCollectionsByRootModuleInstanceId(
            String rootModuleInstanceId, AclPermission editPermission);

    Mono<List<ActionCollection>> archiveActionCollectionByWorkflowId(
            String workflowId, Optional<AclPermission> permission);
}
