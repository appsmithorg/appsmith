package com.appsmith.server.actioncollections.base;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
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

    Mono<List<ActionCollection>> publishActionCollectionsForWorkflow(String workflowId, AclPermission aclPermission);

    Flux<ActionCollectionViewDTO> getActionCollectionsForViewModeForWorkflow(String workflowId, String branchName);

    Flux<ActionCollection> getAllModuleInstanceCollectionsInContext(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean viewMode);

    Mono<ActionCollectionDTO> getPublicActionCollection(String moduleId, ResourceModes resourceMode);
}
