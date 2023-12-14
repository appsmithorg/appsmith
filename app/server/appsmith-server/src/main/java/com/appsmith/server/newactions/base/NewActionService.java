package com.appsmith.server.newactions.base;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.AnalyticEventDTO;
import com.mongodb.bulk.BulkWriteResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface NewActionService extends NewActionServiceCE {
    Mono<NewAction> sendNewActionAnalyticsEvent(AnalyticEventDTO analyticEventDTO, String origin);

    Mono<List<NewAction>> archiveActionsByModuleId(String moduleId);

    Mono<List<ActionDTO>> archiveActionsByRootModuleInstanceId(String moduleInstanceId);

    Mono<NewAction> findPublicActionByModuleId(String moduleId, ResourceModes resourceMode);

    Flux<NewAction> findUnpublishedOnLoadActionsExplicitSetByUserInModule(String moduleId);

    Flux<NewAction> findAllUnpublishedComposedActionsByRootModuleInstanceId(
            String moduleInstanceId, AclPermission permission, boolean includeJs);

    Flux<NewAction> findAllJSActionsByCollectionIds(List<String> collectionIds, List<String> projectionFields);

    Mono<List<NewAction>> archiveActionsByWorkflowId(String workflowId, Optional<AclPermission> permission);

    Mono<List<BulkWriteResult>> publishActionsForWorkflows(String workflowId, AclPermission aclPermission);

    Flux<NewAction> findPublicActionsByModuleInstanceId(String moduleInstanceId, Optional<AclPermission> permission);

    Mono<Boolean> archiveAllByIdsWithoutPermission(Collection<String> actionIds);
}
