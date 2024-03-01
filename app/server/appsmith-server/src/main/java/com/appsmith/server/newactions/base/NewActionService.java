package com.appsmith.server.newactions.base;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.AnalyticEventDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface NewActionService extends NewActionServiceCE {
    Mono<NewAction> sendNewActionAnalyticsEvent(AnalyticEventDTO analyticEventDTO, String origin);

    Flux<NewAction> findAllByPackageIdAndViewMode(String packageId, Boolean viewMode);

    Mono<List<NewAction>> archiveActionsByModuleId(String moduleId);

    Mono<List<ActionDTO>> archiveActionsByRootModuleInstanceId(String moduleInstanceId);

    Mono<NewAction> findPublicActionByModuleId(String moduleId, ResourceModes resourceMode);

    Flux<NewAction> findUnpublishedOnLoadActionsExplicitSetByUserInModule(String moduleId);

    Flux<NewAction> findAllUnpublishedComposedActionsByRootModuleInstanceId(
            String moduleInstanceId, AclPermission permission, boolean includeJs);

    Flux<ActionViewDTO> findAllUnpublishedComposedActionViewDTOsByRootModuleInstanceId(
            String rootModuleInstanceId, AclPermission permission, boolean includeJs);

    Flux<NewAction> findAllJSActionsByCollectionIds(List<String> collectionIds, List<String> projectionFields);

    Flux<ActionDTO> findAllJSActionsByCollectionIdsAndViewMode(
            List<String> collectionIds, List<String> projectionFields, boolean viewMode);

    Mono<List<NewAction>> archiveActionsByWorkflowId(String workflowId, Optional<AclPermission> permission);

    Mono<Void> publishActionsForWorkflows(String workflowId, AclPermission aclPermission);

    Flux<NewAction> findPublicActionsByModuleInstanceId(String moduleInstanceId, Optional<AclPermission> permission);

    Flux<ActionViewDTO> getActionsForViewModeForWorkflow(String workflowId, String branchName);

    Mono<Boolean> archiveAllByIdsWithoutPermission(Collection<String> actionIds);

    Mono<Void> publishActionsForActionCollection(String actionCollectionId, AclPermission aclPermission);

    Flux<ActionViewDTO> getAllModuleInstanceActionInContext(
            String contextId,
            CreatorContextType contextType,
            AclPermission permission,
            boolean viewMode,
            boolean includeJs);

    void generateAndSetActionPolicies(ModuleInstance moduleInstance, NewAction action);

    void generateAndSetActionPolicies(Module module, NewAction newAction);
}
