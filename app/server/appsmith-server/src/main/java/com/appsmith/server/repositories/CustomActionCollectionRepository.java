package com.appsmith.server.repositories;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCE;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

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

    Mono<UpdateResult> archiveDeletedUnpublishedActionsCollectionsForWorkflows(
            String workflowId, AclPermission aclPermission);

    Flux<ActionCollection> findAllModuleInstanceEntitiesByContextAndViewMode(
            String contextId,
            CreatorContextType contextType,
            Optional<AclPermission> optionalPermission,
            boolean viewMode);

    Mono<ActionCollection> findPublicActionCollectionByModuleId(String moduleId, ResourceModes resourceMode);
}
